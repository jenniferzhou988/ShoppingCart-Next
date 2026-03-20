import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { validateStartup } from "../../../lib/startup";

export async function GET(req: NextRequest) {
  validateStartup();

  try {
    const imports = await prisma.productsImport.findMany({
      orderBy: { created: "desc" },
      include: { product: true },
    });
    return NextResponse.json(imports, { status: 200 });
  } catch (error) {
    console.error("Error fetching product imports:", error);
    return NextResponse.json({ error: "Failed to fetch product imports" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  validateStartup();

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { productId, priceIn, quantity, createdBy, modifiedBy } = body as {
      productId?: number;
      priceIn?: number;
      quantity?: number;
      createdBy?: string;
      modifiedBy?: string;
    };

    if (!productId || priceIn === undefined || quantity === undefined) {
      return NextResponse.json({ error: "productId, priceIn and quantity are required" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const newImport = await prisma.productsImport.create({
      data: {
        product: { connect: { id: productId } },
        priceIn: priceIn as any,
        quantity,
        createdBy,
        modifiedBy,
      },
      include: { product: true },
    });

    return NextResponse.json(newImport, { status: 201 });
  } catch (error) {
    console.error("Error creating product import:", error);
    return NextResponse.json({ error: "Failed to create product import" }, { status: 500 });
  }
}
