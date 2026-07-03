import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function ensurePgVector(): Promise<void> {
  await prisma.$executeRawUnsafe("CREATE EXTENSION IF NOT EXISTS vector");
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
