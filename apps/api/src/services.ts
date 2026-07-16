import { createRecallLayerServices } from "@recalllayer/core";
import { prisma } from "@recalllayer/db";

export const appServices = createRecallLayerServices(prisma);
