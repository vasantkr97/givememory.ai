import type { MemoryStore } from "@givememory/db";
import type { Memory } from "@prisma/client";
import type { VectorStore } from "../vector/vectorStore";
import { getConnectionIds, setConnectionIds } from "./types";

const CONNECTION_THRESHOLD = 0.6;
const MAX_CONNECTIONS = 5;

export class ConnectionFinder {
  constructor(
    private readonly memoryStore: MemoryStore,
    private readonly vectorStore: VectorStore
  ) {}

  async findAndPersist(newBubble: Memory, embedding: number[], conversationId: number): Promise<number[]> {
    const results = await this.vectorStore.search(conversationId, embedding, MAX_CONNECTIONS * 2);
    const topConnections = results
      .filter((result) => result.memoryId !== newBubble.id && result.score >= CONNECTION_THRESHOLD)
      .slice(0, MAX_CONNECTIONS);

    if (topConnections.length === 0) {
      return [];
    }

    const connectionIds = topConnections.map((connection) => connection.memoryId);
    const connectionScores = Object.fromEntries(
      topConnections.map((connection) => [String(connection.memoryId), Number(connection.score.toFixed(3))])
    );

    await this.memoryStore.update(newBubble.id, {
      metadata: setConnectionIds(newBubble, connectionIds, connectionScores)
    });

    const connectedMemories = await this.memoryStore.findManyByIds(connectionIds);
    for (const memory of connectedMemories) {
      const existingIds = getConnectionIds(memory);
      if (existingIds.includes(newBubble.id)) {
        continue;
      }

      await this.memoryStore.update(memory.id, {
        metadata: setConnectionIds(memory, [...existingIds, newBubble.id], {
          ...connectionScores,
          [String(newBubble.id)]: Number((topConnections.find((item) => item.memoryId === memory.id)?.score ?? 0).toFixed(3))
        })
      });
    }

    return connectionIds;
  }
}
