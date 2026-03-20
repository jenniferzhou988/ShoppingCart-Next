import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { validateStartup } from "../../../../lib/startup";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  validateStartup();

  try {
    const id = Number.parseInt(params.id, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const record = await prisma.billingBankCardInfo.findUnique({
      where: { id },
      include: { billingType: true, customer: true },
    });

    if (!record) {
      return NextResponse.json({ error: "Billing card info not found" }, { status: 404 });
    }

    return NextResponse.json(record, { status: 200 });
  } catch (error) {
    console.error("Error fetching billing card info by id:", error);
    return NextResponse.json({ error: "Failed to fetch billing card info" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  validateStartup();

  try {
    const id = Number.parseInt(params.id, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const existing = await prisma.billingBankCardInfo.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Billing card info not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
      billingTypeId,
      customerId,
      cardNumber,
      expiryMonth,
      expiryDate,
      cvw,
    } = body as {
      billingTypeId?: number;
      customerId?: number;
      cardNumber?: string;
      expiryMonth?: number;
      expiryDate?: number;
      cvw?: string;
    };

    const updateData: Record<string, unknown> = {};
    if (billingTypeId !== undefined) updateData.billingType = { connect: { id: billingTypeId } };
    if (customerId !== undefined) updateData.customer = { connect: { id: customerId } };
    if (cardNumber !== undefined) {
      const trimmed = String(cardNumber).replaceAll(" ", "").replaceAll("\t", "").replaceAll("\n", "");
      if (trimmed.length < 12 || trimmed.length > 19) {
        return NextResponse.json({ error: "Invalid card number length" }, { status: 400 });
      }
      updateData.cardNumber = trimmed;
      updateData.last4Digits = trimmed.slice(-4);
    }
    if (expiryMonth !== undefined) updateData.expiryMonth = expiryMonth;
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate;
    if (cvw !== undefined) updateData.cvw = String(cvw).trim();

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "At least one field required for update" }, { status: 400 });
    }

    const updated = await prisma.billingBankCardInfo.update({
      where: { id },
      data: updateData,
      include: { billingType: true, customer: true },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error updating billing card info:", error);
    return NextResponse.json({ error: "Failed to update billing card info" }, { status: 500 });
  }
}
