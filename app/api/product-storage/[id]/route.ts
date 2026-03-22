import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { validateStartup } from "../../../../lib/startup";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  validateStartup();
  const { id } = await params;

  try {
    const storageId = parseInt(id, 10);
    if (isNaN(storageId)) {
      return NextResponse.json({ error: "Invalid storage ID" }, { status: 400 });
    }

    const storage = await prisma.productStorage.findUnique({
      where: { id: storageId },
      include: { product: true },
    });

    if (!storage) {
      return NextResponse.json({ error: "Product storage not found" }, { status: 404 });
    }

    return NextResponse.json(storage, { status: 200 });
  } catch (error) {
    console.error("Error fetching product storage:", error);
    return NextResponse.json({ error: "Failed to fetch product storage" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  validateStartup();
  const { id } = await params;

  try {
    const storageId = parseInt(id, 10);
    if (isNaN(storageId)) {
      return NextResponse.json({ error: "Invalid storage ID" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { productId, quantity } = body as {
      productId?: number;
      quantity?: number;
    };

    const updateData: Record<string, unknown> = {};
    if (productId !== undefined) {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      updateData.product = { connect: { id: productId } };
    }
    if (quantity !== undefined) updateData.quantity = quantity;

    const updated = await prisma.productStorage.update({
      where: { id: storageId },
      data: updateData,
      include: { product: true },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error updating product storage:", error);
    return NextResponse.json({ error: "Failed to update product storage" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return PATCH(req, { params });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  validateStartup();
  const { id } = await params;

  try {
    const storageId = parseInt(id, 10);
    if (isNaN(storageId)) {
      return NextResponse.json({ error: "Invalid storage ID" }, { status: 400 });
    }

    await prisma.productStorage.delete({ where: { id: storageId } });
    return NextResponse.json({ message: "Product storage deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting product storage:", error);
    return NextResponse.json({ error: "Failed to delete product storage" }, { status: 500 });
  }
}
