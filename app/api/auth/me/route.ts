import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth";
import { validateStartup } from "../../../../lib/startup";

export async function GET(req: NextRequest) {
  validateStartup();
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
  }

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const user = await getCurrentUser(token);
  if (!user) {
    return NextResponse.json({ error: "Invalid token or user not found" }, { status: 401 });
  }

  return NextResponse.json({ user });
}
