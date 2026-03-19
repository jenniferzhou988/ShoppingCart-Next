import bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { prisma } from "./prisma";
import { requireEnv } from "./env";

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? "1h") as jwt.SignOptions["expiresIn"];

function getJwtSecret(): jwt.Secret {
  return requireEnv("JWT_SECRET") as jwt.Secret;
}

export type JwtPayload = {
  sub: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
};

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hashed: string) {
  return bcrypt.compare(password, hashed);
}

export function signToken(payload: Omit<JwtPayload, "iat" | "exp">) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret()) as unknown as JwtPayload;
}

export async function getCurrentUser(token: string) {
  const payload = verifyToken(token);
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { role: true },
  });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    role: user.role.name,
    createdAt: user.createdAt,
  };
}

export async function logUserLogin(userId: number, success: boolean, ipAddress?: string, userAgent?: string) {
  try {
    await prisma.userLoginLog.create({
      data: {
        userId: userId > 0 ? userId : null, // Use null for failed attempts where user doesn't exist
        success,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("Failed to log user login:", error);
    // Don't throw error to avoid breaking login flow
  }
}
