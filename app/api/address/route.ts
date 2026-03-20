import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { validateStartup } from "../../../lib/startup";

// GET all addresses
export async function GET(req: NextRequest) {
  validateStartup();

  try {
    const addresses = await prisma.address.findMany({
      orderBy: { created: "desc" },
    });

    return NextResponse.json(addresses, { status: 200 });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 }
    );
  }
}

// POST - Create a new address
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
      streetNumber,
      street,
      city,
      postCode,
      province,
      country,
      createdBy,
    } = body as {
      streetNumber?: string;
      street?: string;
      city?: string;
      postCode?: string;
      province?: string;
      country?: string;
      createdBy?: string;
    };

    // Validate required fields
    if (!streetNumber || !street || !city || !postCode || !province || !country) {
      return NextResponse.json(
        {
          error: "All fields are required: streetNumber, street, city, postCode, province, country",
        },
        { status: 400 }
      );
    }

    const address = await prisma.address.create({
      data: {
        streetNumber: String(streetNumber).trim(),
        street: String(street).trim(),
        city: String(city).trim(),
        postCode: String(postCode).trim(),
        province: String(province).trim(),
        country: String(country).trim(),
        createdBy: createdBy ? String(createdBy).trim() : "system",
      },
    });

    return NextResponse.json(address, { status: 201 });
  } catch (error) {
    console.error("Error creating address:", error);
    return NextResponse.json(
      { error: "Failed to create address" },
      { status: 500 }
    );
  }
}
