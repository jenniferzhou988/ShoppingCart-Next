import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";
import { validateStartup } from "../../../lib/startup";

// GET - Get user's shopping cart
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

    // Find customer through user relationship
    const customer = await prisma.customer.findFirst({
      where: { user: { id: user.id } },
      include: {
        shoppingCarts: {
          include: {
            shoppingCartDetails: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Return the most recent shopping cart or empty if none exists
    const shoppingCart = customer.shoppingCarts[0] || null;

    return NextResponse.json({ shoppingCart }, { status: 200 });
  } catch (error) {
    console.error("Error fetching shopping cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch shopping cart" },
      { status: 500 }
    );
  }
}

// POST - Create a new shopping cart for the authenticated user
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

    // Find customer through user relationship
    const customer = await prisma.customer.findFirst({
      where: { user: { id: user.id } },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found. Please create a customer profile first." }, { status: 404 });
    }

    // Check if customer already has a shopping cart
    const existingCart = await prisma.shoppingCart.findFirst({
      where: { customerId: customer.id },
    });

    if (existingCart) {
      return NextResponse.json(
        { error: "Customer already has an active shopping cart", shoppingCart: existingCart },
        { status: 409 }
      );
    }

    // Create new shopping cart
    const shoppingCart = await prisma.shoppingCart.create({
      data: {
        customerId: customer.id,
      },
      include: {
        shoppingCartDetails: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(shoppingCart, { status: 201 });
  } catch (error) {
    console.error("Error creating shopping cart:", error);
    return NextResponse.json(
      { error: "Failed to create shopping cart" },
      { status: 500 }
    );
  }
}