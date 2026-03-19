import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { validateStartup } from "../../../../lib/startup";

// GET - Get single product by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  validateStartup();
  const { id } = await params;

  try {
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
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

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PATCH/PUT - Update product
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  validateStartup();
  const { id } = await params;

  try {
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

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
      modifiedBy,
      categoryIds,
    } = body as {
      productName?: string;
      description?: string;
      price?: number;
      salePrice?: number;
      csdnNumber?: string;
      modifiedBy?: string;
      categoryIds?: number[];
    };

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Update product
    const updateData: any = {};
    if (productName !== undefined) updateData.productName = productName.trim();
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price.toString());
    if (salePrice !== undefined)
      updateData.salePrice = salePrice ? parseFloat(salePrice.toString()) : null;
    if (csdnNumber !== undefined) updateData.csdnNumber = csdnNumber;
    if (modifiedBy !== undefined) updateData.modifiedBy = modifiedBy;

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
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

    // Update categories if provided
    if (categoryIds && Array.isArray(categoryIds)) {
      // Delete existing category links
      await prisma.productCategoryLink.deleteMany({
        where: { productId },
      });

      // Create new category links
      await prisma.productCategoryLink.createMany({
        data: categoryIds.map((categoryId) => ({
          productId,
          productCategoryId: categoryId,
        })),
      });

      // Fetch updated product with new categories
      const finalProduct = await prisma.product.findUnique({
        where: { id: productId },
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

      return NextResponse.json(finalProduct, { status: 200 });
    }

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// PUT - Update product (alias for PATCH)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PATCH(req, { params });
}

// DELETE - Delete product
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  validateStartup();
  const { id } = await params;

  try {
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Delete product (cascade will handle related records)
    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json(
      { message: "Product deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
