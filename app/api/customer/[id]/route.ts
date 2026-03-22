import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { validateStartup } from "../../../../lib/startup";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET a specific customer by ID
export async function GET(req: NextRequest, { params }: RouteParams) {
  validateStartup();

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid customer ID" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        customerAddresses: {
          include: {
            address: true,
          },
        },
        orders: true,
        billingBankCardInfos: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(customer, { status: 200 });
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

// PUT - Update a customer
export async function PUT(req: NextRequest, { params }: RouteParams) {
  validateStartup();

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid customer ID" },
        { status: 400 }
      );
    }

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const {
      firstName,
      middleName,
      lastName,
      primaryPhone,
      secondPhone,
    } = body as {
      firstName?: string;
      middleName?: string;
      lastName?: string;
      primaryPhone?: string;
      secondPhone?: string;
    };

    // Build update data - only include fields that are provided
    const updateData: Record<string, unknown> = {};
    if (firstName !== undefined) updateData.firstName = String(firstName).trim();
    if (middleName !== undefined) updateData.middleName = middleName ? String(middleName).trim() : null;
    if (lastName !== undefined) updateData.lastName = String(lastName).trim();
    if (primaryPhone !== undefined) updateData.primaryPhone = String(primaryPhone).trim();
    if (secondPhone !== undefined) updateData.secondPhone = secondPhone ? String(secondPhone).trim() : null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "At least one field must be provided to update" },
        { status: 400 }
      );
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: updateData,
      include: {
        customerAddresses: {
          include: {
            address: true,
          },
        },
        orders: true,
        billingBankCardInfos: true,
      },
    });

    return NextResponse.json(updatedCustomer, { status: 200 });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a customer
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  validateStartup();

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid customer ID" },
        { status: 400 }
      );
    }

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Check if customer has associated orders or addresses
    const customerAddresses = await prisma.customerAddress.findMany({
      where: { customerId: id },
    });

    const orders = await prisma.order.findMany({
      where: { customerId: id },
    });

    const billingCardInfos = await prisma.billingBankCardInfo.findMany({
      where: { customerId: id },
    });

    if (customerAddresses.length > 0 || orders.length > 0 || billingCardInfos.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete customer that has associated addresses, orders, or billing card information",
          details: {
            associatedAddressesCount: customerAddresses.length,
            associatedOrdersCount: orders.length,
            associatedBillingCardInfoCount: billingCardInfos.length,
          },
        },
        { status: 409 }
      );
    }

    const deletedCustomer = await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        message: "Customer deleted successfully",
        data: deletedCustomer,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
