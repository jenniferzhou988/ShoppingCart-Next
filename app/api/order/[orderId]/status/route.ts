import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../lib/auth";
import { validateStartup } from "../../../../../lib/startup";

// PUT - Update order status
export async function PUT(
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

    const { orderStatus } = body as {
      orderStatus?: string;
    };

    if (!orderStatus) {
      return NextResponse.json(
        { error: "orderStatus is required" },
        { status: 400 }
      );
    }

    // Find the order status
    const status = await prisma.orderStatus.findFirst({
      where: { orderStatus: orderStatus },
    });

    if (!status) {
      return NextResponse.json(
        { error: `Order status '${orderStatus}' not found. Available statuses: Ordered, Shipping, Received` },
        { status: 404 }
      );
    }

    // Find customer through user relationship
    const customer = await prisma.customer.findFirst({
      where: { user: { id: user.id } },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Find order - admins can update all orders, regular users only their own
    const order = await prisma.order.findFirst({
      where: user.role === 'ADMIN'
        ? { id: orderId }
        : { id: orderId, customerId: customer.id },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 });
    }

    // Validate status transition logic
    const currentStatus = order.orderStatus?.orderStatus;

    // Define valid status transitions
    const validTransitions: Record<string, string[]> = {
      'Ordered': ['Shipping', 'Received'], // Can go to shipping or directly to received
      'Shipping': ['Received'], // Can only go to received
      'Received': [], // Final status, cannot change
    };

    if (currentStatus && !validTransitions[currentStatus]?.includes(orderStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status transition from '${currentStatus}' to '${orderStatus}'`,
          validTransitions: validTransitions[currentStatus] || []
        },
        { status: 400 }
      );
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        orderStatusId: status.id,
        modifiedBy: user.email,
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
                productStorage: true,
              },
            },
          },
        },
        orderShippingRecords: true,
      },
    });

    return NextResponse.json({
      message: `Order status updated to '${orderStatus}'`,
      order: updatedOrder,
    }, { status: 200 });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}