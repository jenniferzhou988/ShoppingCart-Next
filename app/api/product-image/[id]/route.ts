import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { validateStartup } from "../../../../lib/startup";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  validateStartup();

  try {
    const { id: idParam } = await params;
    const id = Number.parseInt(idParam, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid product image ID" }, { status: 400 });
    }

    const image = await prisma.productImage.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!image) {
      return NextResponse.json({ error: "Product image not found" }, { status: 404 });
    }

    return NextResponse.json(image, { status: 200 });
  } catch (error) {
    console.error("Error fetching product image by ID:", error);
    return NextResponse.json({ error: "Failed to fetch product image" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  validateStartup();

  try {
    const { id: idParam } = await params;
    const id = Number.parseInt(idParam, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid product image ID" }, { status: 400 });
    }

    const existing = await prisma.productImage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Product image not found" }, { status: 404 });
    }

    const deleted = await prisma.productImage.delete({ where: { id } });

    return NextResponse.json({ message: "Product image deleted", data: deleted }, { status: 200 });
  } catch (error) {
    console.error("Error deleting product image:", error);
    return NextResponse.json({ error: "Failed to delete product image" }, { status: 500 });
  }
}
