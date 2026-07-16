import { Router } from "express";
import { prisma } from "@recalllayer/db";
import { createConversationSchema } from "@recalllayer/shared";
import { appServices } from "../services";
import { authenticate } from "../auth/middleware";
import { asyncHandler } from "../middleware/asyncHandler";

export const conversationRoutes = Router();

conversationRoutes.use(authenticate);

conversationRoutes.get(
  "/",
  asyncHandler(async (request, response) => {
    const conversations = await prisma.conversation.findMany({
      where: { userId: request.user!.id },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: {
            messages: true,
            memories: true
          }
        }
      }
    });
    response.json({ conversations });
  })
);

conversationRoutes.post(
  "/",
  asyncHandler(async (request, response) => {
    const input = createConversationSchema.parse(request.body);
    const conversation = await appServices.stores.conversationStore.getOrCreateForUser(request.user!.id);

    if (input.id !== undefined && input.id !== conversation.id) {
      response.status(403).json({ detail: "Conversation access denied" });
      return;
    }
    response.status(201).json({ conversation });
  })
);

conversationRoutes.get(
  "/:id",
  asyncHandler(async (request, response) => {
    const conversationId = Number(request.params.id);
    const conversation = await appServices.stores.conversationStore.findOwnedById(request.user!.id, conversationId);
    if (!conversation) {
      response.status(404).json({ error: "NotFound", message: "Conversation not found" });
      return;
    }

    response.json({ conversation });
  })
);

conversationRoutes.get(
  "/:id/messages",
  asyncHandler(async (request, response) => {
    const conversationId = Number(request.params.id);
    const conversation = await appServices.stores.conversationStore.findOwnedById(request.user!.id, conversationId);
    if (!conversation) {
      response.status(404).json({ detail: "Conversation not found" });
      return;
    }

    const messages = await appServices.stores.messageStore.listByConversation(conversationId, 200);
    response.json({ messages });
  })
);

conversationRoutes.get(
  "/:id/memories",
  asyncHandler(async (request, response) => {
    const conversationId = Number(request.params.id);
    const conversation = await appServices.stores.conversationStore.findOwnedById(request.user!.id, conversationId);
    if (!conversation) {
      response.status(404).json({ detail: "Conversation not found" });
      return;
    }

    const includeInactive = request.query.includeInactive === "true";
    const memories = await appServices.stores.memoryStore.listByConversation(conversationId, {
      includeInactive,
      limit: 200
    });
    response.json({ memories });
  })
);
