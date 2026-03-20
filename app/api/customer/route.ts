import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { validateStartup } from "../../../lib/startup";

// GET all customers
export async function GET(req: NextRequest) {
  validateStartup();

  try {
    const customers = await prisma.customer.findMany({
      include: {
        customerAddresses: {
          include: {
            address: true,
          },
        },
        orders: true,
        billingBankCardInfos: true,
      },
      orderBy: { created: "desc" },
    });

    return NextResponse.json(customers, { status: 200 });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

// POST - Create a new customer
export async function POST(req: NextRequest) {
  validateStartup();

  try {
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

    // Validate required fields
    if (!firstName || !lastName || !primaryPhone) {
      return NextResponse.json(
        {
          error: "Required fields missing: firstName, lastName, primaryPhone",
        },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        firstName: String(firstName).trim(),
        middleName: middleName ? String(middleName).trim() : null,
        lastName: String(lastName).trim(),
        primaryPhone: String(primaryPhone).trim(),
        secondPhone: secondPhone ? String(secondPhone).trim() : null,
      },
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

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}
