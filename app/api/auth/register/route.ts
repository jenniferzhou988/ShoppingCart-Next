import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { hashPassword, signToken } from "../../../../lib/auth";
import { validateStartup } from "../../../../lib/startup";

export async function POST(req: NextRequest) {
  validateStartup();
  const body = await req.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, password, role: roleName } = body as {
    email?: string;
    password?: string;
    role?: string;
  };

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const role = await prisma.role.upsert({
    where: { name: roleName ?? "USER" },
    update: {},
    create: { name: roleName ?? "USER" },
  });

  // Create a customer profile for the user
  const customer = await prisma.customer.create({
    data: {
      firstName: normalizedEmail, // Using email as firstName for now - can be updated later
      lastName: "User",
      primaryPhone: "000-000-0000", // Default phone - should be updated by user
    },
  });

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: hashed,
      role: { connect: { id: role.id } },
      customer: { connect: { id: customer.id } },
    },
    include: { role: true, customer: true },
  });

  const token = signToken({
    sub: user.id,
    email: user.email,
    role: user.role.name,
  });

  return NextResponse.json(
    {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role.name,
      },
    },
    { status: 201 }
  );
}
