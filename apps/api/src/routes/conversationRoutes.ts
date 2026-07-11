import { Router } from "express";
import { prisma } from "@givememory/db";
import { createConversationSchema } from "@givememory/shared";
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
    if (input.id !== undefined && input.id !== request.user!.id) {
      response.status(403).json({ detail: "Conversation access denied" });
      return;
    }

    const conversation = await prisma.conversation.upsert({
      where: { id: request.user!.id },
      create: { id: request.user!.id, userId: request.user!.id },
      update: { userId: request.user!.id }
    });
    response.status(201).json({ conversation });
  })
);

conversationRoutes.get(
  "/:id",
  asyncHandler(async (request, response) => {
    const conversationId = Number(request.params.id);
    if (conversationId !== request.user!.id) {
      response.status(403).json({ detail: "Conversation access denied" });
      return;
    }

    const conversation = await appServices.stores.conversationStore.findById(conversationId);
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
    if (conversationId !== request.user!.id) {
      response.status(403).json({ detail: "Conversation access denied" });
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
    if (conversationId !== request.user!.id) {
      response.status(403).json({ detail: "Conversation access denied" });
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
