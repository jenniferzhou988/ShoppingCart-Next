import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { verifyPassword, signToken, logUserLogin } from "../../../../lib/auth";
import { validateStartup } from "../../../../lib/startup";

export async function POST(req: NextRequest) {
  validateStartup();
  const body = await req.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, password } = body as { email?: string; password?: string };
  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { role: true },
  });

  const ipAddress = req.headers.get("x-forwarded-for") ||
                   req.headers.get("x-real-ip") ||
                   "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  if (!user) {
    // Log failed login attempt
    await logUserLogin(-1, false, ipAddress, userAgent);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    // Log failed login attempt
    await logUserLogin(user.id, false, ipAddress, userAgent);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Log successful login
  await logUserLogin(user.id, true, ipAddress, userAgent);

  const token = signToken({
    sub: user.id,
    email: user.email,
    role: user.role.name,
  });

  return NextResponse.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role.name,
    },
  });
}
