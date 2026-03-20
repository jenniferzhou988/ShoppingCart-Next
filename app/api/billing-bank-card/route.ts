import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { validateStartup } from "../../../lib/startup";

export async function GET(req: NextRequest) {
  validateStartup();

  try {
    const url = new URL(req.url);
    const customerId = url.searchParams.get("customerId");

    const whereClause = customerId
      ? { customerId: Number.parseInt(customerId, 10) }
      : undefined;

    const records = await prisma.billingBankCardInfo.findMany({
      where: whereClause,
      orderBy: { created: "desc" },
      include: { billingType: true, customer: true },
    });

    return NextResponse.json(records, { status: 200 });
  } catch (error) {
    console.error("Error fetching billing card info:", error);
    return NextResponse.json({ error: "Failed to fetch billing card info" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  validateStartup();

  try {
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

    if (!billingTypeId || !customerId || !cardNumber || !expiryMonth || !expiryDate || !cvw) {
      return NextResponse.json(
        {
          error:
            "billingTypeId, customerId, cardNumber, expiryMonth, expiryDate, and cvw are required",
        },
        { status: 400 }
      );
    }

    const trimmedCardNumber = String(cardNumber).replaceAll(" ", "").replaceAll("\t", "").replaceAll("\n", "");
    if (trimmedCardNumber.length < 12 || trimmedCardNumber.length > 19) {
      return NextResponse.json({ error: "Invalid card number length" }, { status: 400 });
    }

    const last4Digits = trimmedCardNumber.slice(-4);

    const newRecord = await prisma.billingBankCardInfo.create({
      data: {
        billingType: { connect: { id: billingTypeId } },
        customer: { connect: { id: customerId } },
        cardNumber: trimmedCardNumber,
        last4Digits,
        expiryMonth,
        expiryDate,
        cvw,
      },
      include: { billingType: true, customer: true },
    });

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error) {
    console.error("Error creating billing card info:", error);
    return NextResponse.json({ error: "Failed to create billing card info" }, { status: 500 });
  }
}
