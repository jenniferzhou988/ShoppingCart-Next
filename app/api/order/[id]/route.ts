import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";
import { validateStartup } from "../../../../lib/startup";

// GET - Get specific order by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  validateStartup();

  try {
    const { id } = await params;
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
    }

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const user = await getCurrentUser(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token or user not found" }, { status: 401 });
    }

    const orderId = Number.parseInt(id, 10);
    if (Number.isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    let customerId: number | null = null;
    if (user.role !== 'ADMIN') {
      const customer = await prisma.customer.findFirst({
        where: { user: { id: user.id } },
        select: { id: true },
      });

      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }

      customerId = customer.id;
    }

    // Get order - admins can see all orders, regular users only their own
    const order = await prisma.order.findFirst({
      where: user.role === 'ADMIN'
        ? { id: orderId }
        : { id: orderId, customerId },
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

    if (!order) {
      return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 });
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// PUT - Update order
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  validateStartup();

  try {
    const { id } = await params;
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
    }

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const user = await getCurrentUser(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token or user not found" }, { status: 401 });
    }

    const orderId = Number.parseInt(id, 10);
    if (Number.isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
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
    } = body as {
      shippingAddressId?: number;
      billingAddressId?: number;
      billingBankCardInfoId?: number;
    };

    let customerId: number | null = null;
    if (user.role !== 'ADMIN') {
      const customer = await prisma.customer.findFirst({
        where: { user: { id: user.id } },
        select: { id: true },
      });

      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }

      customerId = customer.id;
    }

    // Find order - admins can update all orders, regular users only their own
    const existingOrder = await prisma.order.findFirst({
      where: user.role === 'ADMIN'
        ? { id: orderId }
        : { id: orderId, customerId },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 });
    }

    // Validate addresses if provided
    if (shippingAddressId) {
      if (!customerId) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }

      const shippingAddress = await prisma.customerAddress.findFirst({
        where: {
          customerId,
          addressId: shippingAddressId,
        },
      });

      if (!shippingAddress) {
        return NextResponse.json(
          { error: "Shipping address not found or doesn't belong to customer" },
          { status: 404 }
        );
      }
    }

    if (billingAddressId) {
      if (!customerId) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }

      const billingAddress = await prisma.customerAddress.findFirst({
        where: {
          customerId,
          addressId: billingAddressId,
        },
      });

      if (!billingAddress) {
        return NextResponse.json(
          { error: "Billing address not found or doesn't belong to customer" },
          { status: 404 }
        );
      }
    }

    // Validate billing card if provided
    if (billingBankCardInfoId) {
      if (!customerId) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }

      const billingCard = await prisma.billingBankCardInfo.findFirst({
        where: {
          id: billingBankCardInfoId,
          customerId,
        },
      });

      if (!billingCard) {
        return NextResponse.json(
          { error: "Billing card not found or doesn't belong to customer" },
          { status: 404 }
        );
      }
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        ...(shippingAddressId && { shippingAddressId }),
        ...(billingAddressId && { billingAddressId }),
        ...(billingBankCardInfoId !== undefined && { billingBankCardInfoId }),
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

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}