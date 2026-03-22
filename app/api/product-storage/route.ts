import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { validateStartup } from "../../../lib/startup";

export async function GET(req: NextRequest) {
  validateStartup();

  try {
    const storages = await prisma.productStorage.findMany({
      orderBy: { id: "desc" },
      include: { product: true },
    });

    return NextResponse.json(storages, { status: 200 });
  } catch (error) {
    console.error("Error fetching product storage:", error);
    return NextResponse.json({ error: "Failed to fetch product storage" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  validateStartup();

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { productId, quantity } = body as {
      productId?: number;
      quantity?: number;
    };

    if (!productId || quantity === undefined) {
      return NextResponse.json({ error: "productId and quantity are required" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const storage = await prisma.productStorage.create({
      data: {
        product: { connect: { id: productId } },
        quantity,
      },
      include: { product: true },
    });

    return NextResponse.json(storage, { status: 201 });
  } catch (error) {
    console.error("Error creating product storage:", error);
    return NextResponse.json({ error: "Failed to create product storage" }, { status: 500 });
  }
}
