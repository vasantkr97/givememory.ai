import { createGivememoryServices } from "@givememory/core";
import { prisma } from "@givememory/db";

export const appServices = createGivememoryServices(prisma);
