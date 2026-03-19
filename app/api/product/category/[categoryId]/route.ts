import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { validateStartup } from "../../../../../lib/startup";

// GET - Get products by category ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  validateStartup();
  const { categoryId } = await params;

  try {
    const categoryIdNum = parseInt(categoryId);

    if (isNaN(categoryIdNum)) {
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 }
      );
    }

    // Check if category exists
    const category = await prisma.productCategory.findUnique({
      where: { id: categoryIdNum },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Get all products in this category
    const products = await prisma.product.findMany({
      where: {
        productCategoryLinks: {
          some: {
            productCategoryId: categoryIdNum,
          },
        },
      },
      include: {
        productImages: true,
        productStorage: true,
        productCategoryLinks: {
          include: {
            productCategory: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        category,
        products,
        count: products.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching products by category:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
