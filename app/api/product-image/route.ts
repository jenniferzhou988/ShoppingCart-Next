import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { validateStartup } from "../../../lib/startup";

export async function GET(req: NextRequest) {
  validateStartup();

  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    const where = productId
      ? { productId: Number.parseInt(productId, 10) }
      : undefined;

    const images = await prisma.productImage.findMany({
      where,
      orderBy: { created: "desc" },
      include: { product: true },
    });

    return NextResponse.json(images, { status: 200 });
  } catch (error) {
    console.error("Error fetching product images:", error);
    return NextResponse.json(
      { error: "Failed to fetch product images" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  validateStartup();

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { productId, image, createdBy } = body as {
      productId?: number;
      image?: string;
      createdBy?: string;
    };

    if (!productId || !image) {
      return NextResponse.json(
        { error: "productId and image are required" },
        { status: 400 }
      );
    }

    const created = await prisma.productImage.create({
      data: {
        product: { connect: { id: productId } },
        image: String(image).trim(),
        createdBy: createdBy ? String(createdBy).trim() : undefined,
      },
      include: { product: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating product image:", error);
    return NextResponse.json({ error: "Failed to create product image" }, { status: 500 });
  }
}
