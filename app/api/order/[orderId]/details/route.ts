import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../lib/auth";
import { validateStartup } from "../../../../../lib/startup";

// POST - Add order details to an existing order
export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  validateStartup();

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
    }

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const user = await getCurrentUser(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token or user not found" }, { status: 401 });
    }

    const orderId = parseInt(params.orderId);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { orderDetails } = body as {
      orderDetails?: Array<{
        productId: number;
        quantity: number;
        salePrice?: number;
      }>;
    };

    if (!orderDetails || !Array.isArray(orderDetails) || orderDetails.length === 0) {
      return NextResponse.json(
        { error: "orderDetails array is required and cannot be empty" },
        { status: 400 }
      );
    }

    // Find customer through user relationship
    const customer = await prisma.customer.findFirst({
      where: { user: { id: user.id } },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Find order - admins can modify all orders, regular users only their own
    const order = await prisma.order.findFirst({
      where: user.role === 'ADMIN'
        ? { id: orderId }
        : { id: orderId, customerId: customer.id },
      include: {
        orderDetails: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 });
    }

    // Check if order can be modified (not shipped or completed)
    if (order.orderStatus?.orderStatus === 'Shipping' || order.orderStatus?.orderStatus === 'Received') {
      return NextResponse.json(
        { error: "Cannot modify order that is already shipped or completed" },
        { status: 400 }
      );
    }

    const newOrderDetails = [];

    // Validate and create order details
    for (const detail of orderDetails) {
      const { productId, quantity, salePrice } = detail;

      if (!productId || !quantity || quantity <= 0) {
        return NextResponse.json(
          { error: "Each order detail must have productId and positive quantity" },
          { status: 400 }
        );
      }

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return NextResponse.json(
          { error: `Product with ID ${productId} not found` },
          { status: 404 }
        );
      }

      // Check if product is already in the order
      const existingDetail = order.orderDetails.find(d => d.productId === productId);

      if (existingDetail) {
        // Update existing detail
        const newQuantity = existingDetail.quantity + quantity;
        const finalSalePrice = salePrice || product.salePrice || product.price;
        const totalPrice = finalSalePrice * newQuantity;

        await prisma.orderDetail.update({
          where: { id: existingDetail.id },
          data: {
            quantity: newQuantity,
            salePrice: finalSalePrice,
            totalPrice: totalPrice,
          },
        });

        newOrderDetails.push(await prisma.orderDetail.findUnique({
          where: { id: existingDetail.id },
          include: {
            product: {
              include: {
                productImages: true,
              },
            },
          },
        }));
      } else {
        // Create new detail
        const finalSalePrice = salePrice || product.salePrice || product.price;
        const totalPrice = finalSalePrice * quantity;

        const newDetail = await prisma.orderDetail.create({
          data: {
            orderId: orderId,
            productId: productId,
            quantity: quantity,
            salePrice: finalSalePrice,
            totalPrice: totalPrice,
          },
          include: {
            product: {
              include: {
                productImages: true,
              },
            },
          },
        });

        newOrderDetails.push(newDetail);
      }
    }

    // Update order modified timestamp
    await prisma.order.update({
      where: { id: orderId },
      data: { modifiedBy: user.email },
    });

    return NextResponse.json({
      message: "Order details added successfully",
      newOrderDetails: newOrderDetails,
    }, { status: 201 });
  } catch (error) {
    console.error("Error adding order details:", error);
    return NextResponse.json(
      { error: "Failed to add order details" },
      { status: 500 }
    );
  }
}