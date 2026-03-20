import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";
import { validateStartup } from "../../../../lib/startup";

// POST - Add item to shopping cart
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

    const { productId, quantity } = body as {
      productId?: number;
      quantity?: number;
    };

    // Validate required fields
    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "productId and positive quantity are required" },
        { status: 400 }
      );
    }

    // Find customer through user relationship
    const customer = await prisma.customer.findFirst({
      where: { user: { id: user.id } },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Find or create shopping cart
    let shoppingCart = await prisma.shoppingCart.findFirst({
      where: { customerId: customer.id },
    });

    if (!shoppingCart) {
      shoppingCart = await prisma.shoppingCart.create({
        data: { customerId: customer.id },
      });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.shoppingCartDetail.findFirst({
      where: {
        shoppingCartId: shoppingCart.id,
        productId: productId,
      },
    });

    if (existingItem) {
      // Update quantity and total price
      const newQuantity = existingItem.quantity + quantity;
      const totalPrice = product.price * newQuantity;

      const updatedItem = await prisma.shoppingCartDetail.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          totalPrice: totalPrice,
        },
        include: {
          product: true,
        },
      });

      return NextResponse.json(updatedItem, { status: 200 });
    } else {
      // Create new cart item
      const totalPrice = product.price * quantity;

      const newItem = await prisma.shoppingCartDetail.create({
        data: {
          shoppingCartId: shoppingCart.id,
          productId: productId,
          quantity: quantity,
          price: product.price,
          totalPrice: totalPrice,
        },
        include: {
          product: true,
        },
      });

      return NextResponse.json(newItem, { status: 201 });
    }
  } catch (error) {
    console.error("Error adding item to shopping cart:", error);
    return NextResponse.json(
      { error: "Failed to add item to shopping cart" },
      { status: 500 }
    );
  }
}