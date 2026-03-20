import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";
import { validateStartup } from "../../../lib/startup";

// GET - Get all orders (admin only) or user's orders
export async function GET(req: NextRequest) {
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

    let orders;

    // If user is admin, get all orders, otherwise get only their orders
    if (user.role === 'ADMIN') {
      orders = await prisma.order.findMany({
        include: {
          customer: true,
          shippingAddress: true,
          billingAddress: true,
          billingBankCardInfo: {
            include: {
              billingType: true,
            },
          },
          orderStatus: true,
          orderDetails: {
            include: {
              product: {
                include: {
                  productImages: true,
                },
              },
            },
          },
          orderShippingRecords: true,
        },
        orderBy: { created: "desc" },
      });
    } else {
      const customer = await prisma.customer.findFirst({
        where: { user: { id: user.id } },
        select: { id: true },
      });

      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }

      orders = await prisma.order.findMany({
        where: { customerId: customer.id },
        include: {
          customer: true,
          shippingAddress: true,
          billingAddress: true,
          billingBankCardInfo: {
            include: {
              billingType: true,
            },
          },
          orderStatus: true,
          orderDetails: {
            include: {
              product: {
                include: {
                  productImages: true,
                },
              },
            },
          },
          orderShippingRecords: true,
        },
        orderBy: { created: "desc" },
      });
    }

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST - Create a new order
export async function POST(req: NextRequest) {
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

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const {
      shippingAddressId,
      billingAddressId,
      billingBankCardInfoId,
      orderDetails,
    } = body as {
      shippingAddressId?: number;
      billingAddressId?: number;
      billingBankCardInfoId?: number;
      orderDetails?: Array<{
        productId: number;
        quantity: number;
        salePrice?: number;
      }>;
    };

    const customer = await prisma.customer.findFirst({
      where: { user: { id: user.id } },
      select: { id: true },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Validate required fields
    if (!shippingAddressId || !billingAddressId) {
      return NextResponse.json(
        { error: "shippingAddressId and billingAddressId are required" },
        { status: 400 }
      );
    }

    // Validate addresses exist and belong to customer
    const shippingAddress = await prisma.customerAddress.findFirst({
      where: {
        customerId: customer.id,
        addressId: shippingAddressId,
      },
    });

    const billingAddress = await prisma.customerAddress.findFirst({
      where: {
        customerId: customer.id,
        addressId: billingAddressId,
      },
    });

    if (!shippingAddress || !billingAddress) {
      return NextResponse.json(
        { error: "Shipping or billing address not found or doesn't belong to customer" },
        { status: 404 }
      );
    }

    // Validate billing card if provided
    if (billingBankCardInfoId) {
      const billingCard = await prisma.billingBankCardInfo.findFirst({
        where: {
          id: billingBankCardInfoId,
          customerId: customer.id,
        },
      });

      if (!billingCard) {
        return NextResponse.json(
          { error: "Billing card not found or doesn't belong to customer" },
          { status: 404 }
        );
      }
    }

    // Get default order status (Ordered)
    const defaultStatus = await prisma.orderStatus.findFirst({
      where: { orderStatus: "Ordered" },
    });

    if (!defaultStatus) {
      return NextResponse.json(
        { error: "Default order status not found. Please seed the database." },
        { status: 500 }
      );
    }

    // Create order with details
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        shippingAddressId,
        billingAddressId,
        billingBankCardInfoId: billingBankCardInfoId || null,
        orderStatusId: defaultStatus.id,
        createdBy: user.email,
        orderDetails: orderDetails ? {
          create: orderDetails.map(detail => ({
            productId: detail.productId,
            quantity: detail.quantity,
            salePrice: detail.salePrice || 0, // Will be calculated from product price
            totalPrice: 0, // Will be calculated
          })),
        } : undefined,
      },
      include: {
        customer: true,
        shippingAddress: true,
        billingAddress: true,
        billingBankCardInfo: {
          include: {
            billingType: true,
          },
        },
        orderStatus: true,
        orderDetails: {
          include: {
            product: {
              include: {
                productImages: true,
              },
            },
          },
        },
      },
    });

    // Calculate and update prices for order details
    if (orderDetails && orderDetails.length > 0) {
      for (const detail of order.orderDetails) {
        const product = await prisma.product.findUnique({
          where: { id: detail.productId },
        });

        if (product) {
          const salePrice = product.salePrice || product.price;
          const totalPrice = salePrice * detail.quantity;

          await prisma.orderDetail.update({
            where: { id: detail.id },
            data: {
              salePrice: salePrice,
              totalPrice: totalPrice,
            },
          });
        }
      }

      // Re-fetch order with updated prices
      const updatedOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: {
          customer: true,
          shippingAddress: true,
          billingAddress: true,
          billingBankCardInfo: {
            include: {
              billingType: true,
            },
          },
          orderStatus: true,
          orderDetails: {
            include: {
              product: {
                include: {
                  productImages: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json(updatedOrder, { status: 201 });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}