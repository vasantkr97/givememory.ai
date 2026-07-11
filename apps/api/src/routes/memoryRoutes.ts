import { Router } from "express";
import { prisma } from "@givememory/db";
import { addMemorySchema, searchMemorySchema, updateMemorySchema } from "@givememory/shared";
import { getConnectionIds } from "@givememory/core";
import { appServices } from "../services";
import { asyncHandler } from "../middleware/asyncHandler";
import { authenticate } from "../auth/middleware";

export const memoryRoutes = Router();
export const memoriesRoutes = Router();

memoryRoutes.post(
  "/add",
  authenticate,
  asyncHandler(async (request, response) => {
    const input = addMemorySchema.parse(request.body);
    if (!canAccessConversation(request.user!.id, input.conversationId)) {
      response.status(403).json({ detail: "Conversation access denied" });
      return;
    }

    const result = await appServices.services.contextMemory.add(input.messages, input.conversationId);
    response.status(201).json(result);
  })
);

memoryRoutes.post(
  "/search",
  authenticate,
  asyncHandler(async (request, response) => {
    const input = searchMemorySchema.parse(request.body);
    if (!canAccessConversation(request.user!.id, input.conversationId)) {
      response.status(403).json({ detail: "Conversation access denied" });
      return;
    }

    const result = await appServices.services.contextMemory.search(
      input.query,
      input.conversationId,
      input.limit,
      input.includeConnections
    );
    response.json(result);
  })
);

memoryRoutes.patch(
  "/:id",
  authenticate,
  asyncHandler(async (request, response) => {
    const input = updateMemorySchema.parse(request.body);
    const existing = await prisma.memory.findFirst({
      where: {
        id: Number(request.params.id),
        conversationId: request.user!.id
      }
    });
    if (!existing) {
      response.status(404).json({ detail: "Memory not found" });
      return;
    }

    const memory = await appServices.services.contextMemory.update(existing.id, input.text);
    response.json({ memory });
  })
);

memoriesRoutes.get(
  "/",
  authenticate,
  asyncHandler(async (request, response) => {
    const conversationId = request.user!.id;
    await prisma.conversation.upsert({
      where: { id: conversationId },
      create: { id: conversationId, userId: request.user!.id },
      update: { userId: request.user!.id }
    });

    const memories = await prisma.memory.findMany({
      where: { conversationId, isActive: true },
      orderBy: { createdAt: "asc" }
    });
    const idMapping = buildIdMapping(memories);
    const links: Array<Record<string, number>> = [];
    const seenLinks = new Set<string>();

    for (const memory of memories) {
      for (const targetId of getConnectionIds(memory)) {
        if (!idMapping[targetId]) {
          continue;
        }
        const [left, right] = [memory.id, targetId].sort((a, b) => a - b);
        const linkKey = `${left}:${right}`;
        if (seenLinks.has(linkKey)) {
          continue;
        }
        seenLinks.add(linkKey);
        links.push({
          source: memory.id,
          target: targetId,
          source_local: idMapping[memory.id],
          target_local: idMapping[targetId],
          strength: getConnectionScore(memory, targetId)
        });
      }
    }

    response.json({
      nodes: memories.map((memory) => ({
        id: memory.id,
        local_id: idMapping[memory.id],
        text: memory.memoryText,
        type: memory.isEpisodic ? "bubble" : "semantic",
        importance: memory.importance,
        created_at: memory.createdAt.toISOString(),
        connections: getConnectionIds(memory)
          .filter((targetId) => Boolean(idMapping[targetId]))
          .map((targetId) => ({
            target_id: idMapping[targetId],
            target_global_id: targetId,
            score: getConnectionScore(memory, targetId)
          }))
      })),
      links,
      id_mapping: idMapping
    });
  })
);

memoryRoutes.get(
  "/:id",
  authenticate,
  asyncHandler(async (request, response) => {
    const conversationId = request.user!.id;
    const memoryId = Number(request.params.id);
    const memories = await prisma.memory.findMany({
      where: { conversationId, isActive: true },
      orderBy: { createdAt: "asc" }
    });
    const idMapping = buildIdMapping(memories);
    const reverseMapping = new Map(Object.entries(idMapping).map(([globalId, localId]) => [localId, Number(globalId)]));
    const resolvedId = memories.some((memory) => memory.id === memoryId) ? memoryId : reverseMapping.get(memoryId);
    const memory = memories.find((item) => item.id === resolvedId);

    if (!memory) {
      response.status(404).json({ detail: "Memory not found" });
      return;
    }

    const connectedMemories = getConnectionIds(memory)
      .map((targetId) => memories.find((item) => item.id === targetId))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map((item) => ({
        id: item.id,
        local_id: idMapping[item.id],
        text: item.memoryText,
        type: item.isEpisodic ? "bubble" : "semantic",
        score: getConnectionScore(memory, item.id),
        created_at: item.createdAt.toISOString()
      }));

    response.json({
      id: memory.id,
      local_id: idMapping[memory.id],
      text: memory.memoryText,
      type: memory.isEpisodic ? "bubble" : "semantic",
      importance: memory.importance,
      created_at: memory.createdAt.toISOString(),
      occurred_at: memory.occurredAt?.toISOString() ?? null,
      connected_memories: connectedMemories
    });
  })
);

memoryRoutes.delete(
  "/:id",
  authenticate,
  asyncHandler(async (request, response) => {
    const memory = await prisma.memory.findFirst({
      where: {
        id: Number(request.params.id),
        conversationId: request.user!.id
      }
    });
    if (!memory) {
      response.status(404).json({ detail: "Memory not found" });
      return;
    }
    const result = await appServices.services.contextMemory.delete(memory.id);
    response.json({
      status: "deleted",
      id: memory.id,
      ...result
    });
  })
);

function buildIdMapping(memories: Array<{ id: number }>) {
  return Object.fromEntries(memories.map((memory, index) => [memory.id, index + 1])) as Record<number, number>;
}

function canAccessConversation(userId: number, conversationId: number) {
  return userId === conversationId;
}

function getConnectionScore(memory: { metadata: unknown }, targetId: number) {
  const metadata = memory.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return 0.7;
  }
  const connections = (metadata as Record<string, unknown>).connections;
  if (!connections || typeof connections !== "object" || Array.isArray(connections)) {
    return 0.7;
  }
  const scores = (connections as Record<string, unknown>).scores;
  if (!scores || typeof scores !== "object" || Array.isArray(scores)) {
    return 0.7;
  }
  const score = (scores as Record<string, unknown>)[String(targetId)];
  return typeof score === "number" ? score : 0.7;
}
