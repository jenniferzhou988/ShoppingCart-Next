import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";
import { validateStartup } from "../../../../lib/startup";

// GET - Get specific shopping cart by ID (only if it belongs to the authenticated user)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: idParam } = await params;
    const cartId = parseInt(idParam);
    if (isNaN(cartId)) {
      return NextResponse.json({ error: "Invalid cart ID" }, { status: 400 });
    }

    if (!user.customerId) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: user.customerId },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Get shopping cart with items, but only if it belongs to the user
    const shoppingCart = await prisma.shoppingCart.findFirst({
      where: {
        id: cartId,
        customerId: customer.id,
      },
      include: {
        shoppingCartDetails: {
          include: {
            product: {
              include: {
                productImages: true,
                productStorage: true,
              },
            },
          },
        },
      },
    });

    if (!shoppingCart) {
      return NextResponse.json({ error: "Shopping cart not found or doesn't belong to user" }, { status: 404 });
    }

    return NextResponse.json(shoppingCart, { status: 200 });
  } catch (error) {
    console.error("Error fetching shopping cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch shopping cart" },
      { status: 500 }
    );
  }
}