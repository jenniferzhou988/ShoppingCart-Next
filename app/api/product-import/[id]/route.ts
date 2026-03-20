import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { validateStartup } from "../../../../lib/startup";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  validateStartup();
  const { id } = await params;

  try {
    const importId = parseInt(id, 10);
    if (isNaN(importId)) {
      return NextResponse.json({ error: "Invalid import ID" }, { status: 400 });
    }

    const existingImport = await prisma.productsImport.findUnique({
      where: { id: importId },
      include: { product: true },
    });

    if (!existingImport) {
      return NextResponse.json({ error: "Product import not found" }, { status: 404 });
    }

    return NextResponse.json(existingImport, { status: 200 });
  } catch (error) {
    console.error("Error fetching product import:", error);
    return NextResponse.json({ error: "Failed to fetch product import" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  validateStartup();
  const { id } = await params;

  try {
    const importId = parseInt(id, 10);
    if (isNaN(importId)) {
      return NextResponse.json({ error: "Invalid import ID" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { productId, priceIn, quantity, modifiedBy } = body as {
      productId?: number;
      priceIn?: number;
      quantity?: number;
      modifiedBy?: string;
    };

    const updateData: Record<string, any> = {};
    if (productId !== undefined) {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      updateData.product = { connect: { id: productId } };
    }
    if (priceIn !== undefined) updateData.priceIn = priceIn;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (modifiedBy !== undefined) updateData.modifiedBy = modifiedBy;

    const updatedImport = await prisma.productsImport.update({
      where: { id: importId },
      data: updateData,
      include: { product: true },
    });

    return NextResponse.json(updatedImport, { status: 200 });
  } catch (error) {
    console.error("Error updating product import:", error);
    return NextResponse.json({ error: "Failed to update product import" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return PATCH(req, { params });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  validateStartup();
  const { id } = await params;

  try {
    const importId = parseInt(id, 10);
    if (isNaN(importId)) {
      return NextResponse.json({ error: "Invalid import ID" }, { status: 400 });
    }

    await prisma.productsImport.delete({ where: { id: importId } });
    return NextResponse.json({ message: "Product import deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting product import:", error);
    return NextResponse.json({ error: "Failed to delete product import" }, { status: 500 });
  }
}
