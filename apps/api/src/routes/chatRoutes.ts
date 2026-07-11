import { Router } from "express";
import { productChatSchema } from "@givememory/shared";
import { prisma } from "@givememory/db";
import { runWithLlmOverride } from "@givememory/core";
import { appServices } from "../services";
import { asyncHandler } from "../middleware/asyncHandler";
import { authenticate, getUserApiKey, requireApiKeyOrFreeTier, toPublicUser } from "../auth/middleware";

export const chatRoutes = Router();

chatRoutes.post(
  "/",
  authenticate,
  requireApiKeyOrFreeTier,
  asyncHandler(async (request, response) => {
    const input = productChatSchema.parse(request.body);
    const user = request.user!;
    const conversationId = user.id;

    await prisma.conversation.upsert({
      where: { id: conversationId },
      create: { id: conversationId, userId: user.id },
      update: { userId: user.id }
    });

    const settings = await appServices.stores.providerSettingsStore.get();
    const systemApiKey = firstConfiguredApiKey(process.env.OPENROUTER_API_KEY, settings.openrouterApiKey);
    const effectiveApiKey = request.effectiveApiKey ?? systemApiKey;
    if (!effectiveApiKey) {
      response.status(503).json({ detail: "System API key not configured. Please add OPENROUTER_API_KEY." });
      return;
    }

    const result = await runWithLlmOverride(
      {
        provider: "openrouter",
        apiKey: effectiveApiKey,
        llmModel: settings.llmModel,
        embeddingModel: settings.embeddingModel
      },
      () => appServices.services.chatService.chat(input.message, conversationId)
    );

    if (!request.effectiveApiKey) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { messageCount: { increment: 1 } }
      });
      request.user = {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        messageCount: updated.messageCount,
        createdAt: updated.createdAt
      };
    }

    const extracted = await buildExtractedMemoryResponse(conversationId, result.extracted);
    await prisma.chatMessage.create({
      data: {
        userId: user.id,
        role: "user",
        content: input.message
      }
    });
    await prisma.chatMessage.create({
      data: {
        userId: user.id,
        role: "assistant",
        content: result.message,
        extractedMemories: extracted
      }
    });

    const hasApiKey = Boolean(await getUserApiKey(user.id));
    response.json({
      response: result.message,
      extracted_memories: extracted,
      relevant_memories: result.memories.results,
      usage: toPublicUser(request.user!, hasApiKey).usage
    });
  })
);

chatRoutes.get(
  "/history",
  authenticate,
  asyncHandler(async (request, response) => {
    const limit = Math.min(Number(request.query.limit ?? 100), 500);
    const offset = Math.max(Number(request.query.offset ?? 0), 0);
    const [total, messages] = await Promise.all([
      prisma.chatMessage.count({ where: { userId: request.user!.id } }),
      prisma.chatMessage.findMany({
        where: { userId: request.user!.id },
        orderBy: { createdAt: "asc" },
        skip: offset,
        take: limit
      })
    ]);

    response.json({
      messages: messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        extracted_memories: message.extractedMemories,
        created_at: message.createdAt.toISOString()
      })),
      total,
      has_more: offset + limit < total
    });
  })
);

chatRoutes.delete(
  "/history",
  authenticate,
  asyncHandler(async (request, response) => {
    await prisma.chatMessage.deleteMany({ where: { userId: request.user!.id } });
    response.json({ message: "Chat history cleared" });
  })
);

function firstConfiguredApiKey(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return null;
}

async function buildExtractedMemoryResponse(
  conversationId: number,
  extracted: { semantic: string[]; bubbles: string[] }
) {
  const allMemories = await prisma.memory.findMany({
    where: { conversationId, isActive: true },
    orderBy: { createdAt: "asc" }
  });
  const localIds = new Map(allMemories.map((memory, index) => [memory.id, index + 1]));
  const recent = [...allMemories].reverse();

  return {
    semantic: extracted.semantic.flatMap((text) => {
      const memory = recent.find((item) => !item.isEpisodic && item.memoryText === text);
      return memory ? [{ id: memory.id, local_id: localIds.get(memory.id) ?? 0, text, type: "semantic" as const }] : [];
    }),
    bubbles: extracted.bubbles.flatMap((text) => {
      const memory = recent.find((item) => item.isEpisodic && item.memoryText === text);
      return memory ? [{ id: memory.id, local_id: localIds.get(memory.id) ?? 0, text, type: "bubble" as const }] : [];
    })
  };
}
