import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { validateStartup } from "../../../../lib/startup";

interface RouteParams { params: Promise<{ id: string; }>; }

export async function GET(req: NextRequest, { params }: RouteParams) {
  validateStartup();
  try {
    const { id: idParam } = await params;
    const id = Number.parseInt(idParam, 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const category = await prisma.productCategory.findUnique({
      where: { id },
      include: { productCategoryLinks: true },
    });
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    return NextResponse.json(category, { status: 200 });
  } catch (error) {
    console.error("Error fetching category by ID:", error);
    return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 });
  }
}

type CategoryUpdatePayload = {
  productCategoryName?: string;
  description?: string;
  comment?: string;
  modifiedBy?: string;
};

function buildCategoryUpdateData(body: CategoryUpdatePayload): Record<string, unknown> {
  const updateData: Record<string, unknown> = {};
  if (body.productCategoryName !== undefined) updateData.productCategoryName = String(body.productCategoryName).trim();
  if (body.description !== undefined) updateData.description = body.description ? String(body.description).trim() : null;
  if (body.comment !== undefined) updateData.comment = body.comment ? String(body.comment).trim() : null;
  if (body.modifiedBy !== undefined) updateData.modifiedBy = String(body.modifiedBy).trim();
  return updateData;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  validateStartup();
  try {
    const { id: idParam } = await params;
    const id = Number.parseInt(idParam, 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const existing = await prisma.productCategory.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const parsedBody = body as CategoryUpdatePayload;
    const updateData = buildCategoryUpdateData(parsedBody);
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "At least one update field is required" }, { status: 400 });
    }

    const requestedName = updateData.productCategoryName as string | undefined;
    if (requestedName && requestedName !== existing.productCategoryName) {
      const nameConflict = await prisma.productCategory.findUnique({
        where: { productCategoryName: requestedName },
      });
      if (nameConflict) return NextResponse.json({ error: "Category name already exists" }, { status: 409 });
    }

    const updated = await prisma.productCategory.update({
      where: { id },
      data: updateData,
      include: { productCategoryLinks: true },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error updating product category:", error);
    return NextResponse.json({ error: "Failed to update product category" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  // same logic as PUT, but semantic partial update model
  return PUT(req, { params });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  validateStartup();
  try {
    const { id: idParam } = await params;
    const id = Number.parseInt(idParam, 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const existing = await prisma.productCategory.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    const productLinkCount = await prisma.productCategoryLink.count({ where: { productCategoryId: id } });
    if (productLinkCount > 0) {
      return NextResponse.json({ error: "Cannot delete category with linked products" }, { status: 409 });
    }

    await prisma.productCategory.delete({ where: { id } });
    return NextResponse.json({ message: "Category deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting product category:", error);
    return NextResponse.json({ error: "Failed to delete product category" }, { status: 500 });
  }
}
