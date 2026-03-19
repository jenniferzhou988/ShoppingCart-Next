import { PrismaClient } from "@prisma/client";

// Prevent multiple instances of PrismaClient in development (Hot reload)
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
