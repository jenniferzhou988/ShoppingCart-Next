import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../lib/auth";
import { validateStartup } from "../../../../../lib/startup";

// DELETE - Remove item from shopping cart
export async function DELETE(
  req: NextRequest,
  { params }: { params: { itemId: string } }
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

    const itemId = parseInt(params.itemId);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    }

    // Find customer through user relationship
    const customer = await prisma.customer.findFirst({
      where: { user: { id: user.id } },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Find shopping cart
    const shoppingCart = await prisma.shoppingCart.findFirst({
      where: { customerId: customer.id },
    });

    if (!shoppingCart) {
      return NextResponse.json({ error: "Shopping cart not found" }, { status: 404 });
    }

    // Find the cart item and verify it belongs to the user's cart
    const cartItem = await prisma.shoppingCartDetail.findFirst({
      where: {
        id: itemId,
        shoppingCartId: shoppingCart.id,
      },
    });

    if (!cartItem) {
      return NextResponse.json({ error: "Cart item not found or doesn't belong to user" }, { status: 404 });
    }

    // Delete the cart item
    await prisma.shoppingCartDetail.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ message: "Item removed from shopping cart" }, { status: 200 });
  } catch (error) {
    console.error("Error removing item from shopping cart:", error);
    return NextResponse.json(
      { error: "Failed to remove item from shopping cart" },
      { status: 500 }
    );
  }
}