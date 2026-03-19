import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { validateStartup } from "../../../lib/startup";

// GET all products or filtered by category
export async function GET(req: NextRequest) {
  validateStartup();

  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");

    if (categoryId) {
      // Get products by category using ProductCategoryLink
      const products = await prisma.product.findMany({
        where: {
          productCategoryLinks: {
            some: {
              productCategoryId: parseInt(categoryId),
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

      return NextResponse.json(products, { status: 200 });
    }

    // Get all products
    const products = await prisma.product.findMany({
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

    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST - Create new product
export async function POST(req: NextRequest) {
  validateStartup();

  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const {
      productName,
      description,
      price,
      salePrice,
      csdnNumber,
      createdBy,
      categoryIds,
    } = body as {
      productName?: string;
      description?: string;
      price?: number;
      salePrice?: number;
      csdnNumber?: string;
      createdBy?: string;
      categoryIds?: number[];
    };

    if (!productName || price === undefined) {
      return NextResponse.json(
        { error: "Product name and price are required" },
        { status: 400 }
      );
    }

    // Create product with category links
    const product = await prisma.product.create({
      data: {
        productName: productName.trim(),
        description,
        price: parseFloat(price.toString()),
        salePrice: salePrice ? parseFloat(salePrice.toString()) : null,
        csdnNumber,
        createdBy,
        productCategoryLinks: {
          create: (categoryIds || []).map((categoryId) => ({
            productCategoryId: categoryId,
          })),
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

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
