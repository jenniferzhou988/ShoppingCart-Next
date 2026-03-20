import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { validateStartup } from "../../../lib/startup";

export async function GET() {
  validateStartup();
  try {
    const categories = await prisma.productCategory.findMany({
      orderBy: { created: "desc" },
      include: { productCategoryLinks: true },
    });
    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error("Error fetching product categories:", error);
    return NextResponse.json({ error: "Failed to fetch product categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  validateStartup();
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { productCategoryName, description, comment, createdBy } = body as {
      productCategoryName?: string;
      description?: string;
      comment?: string;
      createdBy?: string;
    };

    if (!productCategoryName) {
      return NextResponse.json({ error: "productCategoryName is required" }, { status: 400 });
    }

    const existing = await prisma.productCategory.findUnique({ where: { productCategoryName } });
    if (existing) {
      return NextResponse.json({ error: "Category name already exists" }, { status: 409 });
    }

    const category = await prisma.productCategory.create({
      data: {
        productCategoryName: productCategoryName.trim(),
        description: description?.trim() ?? null,
        comment: comment?.trim() ?? null,
        createdBy: createdBy?.trim() ?? null,
      },
      include: { productCategoryLinks: true },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating product category:", error);
    return NextResponse.json({ error: "Failed to create product category" }, { status: 500 });
  }
}
