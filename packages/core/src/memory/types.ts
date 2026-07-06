import type { Memory } from "@prisma/client";

export type MemoryRecord = Memory;

export function getConnectionIds(memory: MemoryRecord): number[] {
  const metadata = memory.metadata;

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return [];
  }

  const connections = (metadata as Record<string, unknown>).connections;
  if (!connections || typeof connections !== "object" || Array.isArray(connections)) {
    return [];
  }

  const bubbleIds = (connections as Record<string, unknown>).bubble_ids;
  if (!Array.isArray(bubbleIds)) {
    return [];
  }

  return bubbleIds.filter((value): value is number => typeof value === "number");
}

export function setConnectionIds(memory: MemoryRecord, connectionIds: number[], scores: Record<string, number>) {
  const baseMetadata =
    memory.metadata && typeof memory.metadata === "object" && !Array.isArray(memory.metadata)
      ? (memory.metadata as Record<string, unknown>)
      : {};

  return {
    ...baseMetadata,
    connections: {
      bubble_ids: connectionIds,
      scores
    }
  };
}
