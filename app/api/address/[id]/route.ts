import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { validateStartup } from "../../../../lib/startup";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET a specific address by ID
export async function GET(req: NextRequest, { params }: RouteParams) {
  validateStartup();

  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid address ID" },
        { status: 400 }
      );
    }

    const address = await prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(address, { status: 200 });
  } catch (error) {
    console.error("Error fetching address:", error);
    return NextResponse.json(
      { error: "Failed to fetch address" },
      { status: 500 }
    );
  }
}

// PUT - Update an address
export async function PUT(req: NextRequest, { params }: RouteParams) {
  validateStartup();

  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid address ID" },
        { status: 400 }
      );
    }

    // Check if address exists
    const existingAddress = await prisma.address.findUnique({
      where: { id },
    });

    if (!existingAddress) {
      return NextResponse.json(
        { error: "Address not found" },
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
      streetNumber,
      street,
      city,
      postCode,
      province,
      country,
      modifiedBy,
    } = body as {
      streetNumber?: string;
      street?: string;
      city?: string;
      postCode?: string;
      province?: string;
      country?: string;
      modifiedBy?: string;
    };

    // Build update data - only include fields that are provided
    const updateData: Record<string, unknown> = {};
    if (streetNumber !== undefined) updateData.streetNumber = String(streetNumber).trim();
    if (street !== undefined) updateData.street = String(street).trim();
    if (city !== undefined) updateData.city = String(city).trim();
    if (postCode !== undefined) updateData.postCode = String(postCode).trim();
    if (province !== undefined) updateData.province = String(province).trim();
    if (country !== undefined) updateData.country = String(country).trim();
    if (modifiedBy !== undefined) updateData.modifiedBy = String(modifiedBy).trim();

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "At least one field must be provided to update" },
        { status: 400 }
      );
    }

    const updatedAddress = await prisma.address.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedAddress, { status: 200 });
  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 }
    );
  }
}

// DELETE - Delete an address
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  validateStartup();

  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid address ID" },
        { status: 400 }
      );
    }

    // Check if address exists
    const existingAddress = await prisma.address.findUnique({
      where: { id },
    });

    if (!existingAddress) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    // Check if address is associated with any orders or customer addresses
    const associatedOrders = await prisma.order.findMany({
      where: {
        OR: [
          { shippingAddressId: id },
          { billingAddressId: id },
        ],
      },
    });

    const associatedCustomerAddresses = await prisma.customerAddress.findMany({
      where: { addressId: id },
    });

    if (associatedOrders.length > 0 || associatedCustomerAddresses.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete address that is associated with orders or customer addresses",
          details: {
            associatedOrdersCount: associatedOrders.length,
            associatedCustomerAddressesCount: associatedCustomerAddresses.length,
          },
        },
        { status: 409 }
      );
    }

    const deletedAddress = await prisma.address.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        message: "Address deleted successfully",
        data: deletedAddress,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 }
    );
  }
}
