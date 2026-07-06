import type { MemoryStore } from "@givememory/db";
import type { Memory } from "@prisma/client";
import type { VectorStore } from "../vector/vectorStore";

export class SimilarMemorySearch {
  constructor(
    private readonly memoryStore: MemoryStore,
    private readonly vectorStore: VectorStore
  ) {}

  async search(conversationId: number, embedding: number[], limit = 10): Promise<Memory[]> {
    const results = await this.vectorStore.search(conversationId, embedding, limit);
    if (results.length === 0) {
      return [];
    }

    const memories = await this.memoryStore.findManyByIds(results.map((result) => result.memoryId));
    const byId = new Map(memories.map((memory) => [memory.id, memory]));

    return results.map((result) => byId.get(result.memoryId)).filter((memory): memory is Memory => Boolean(memory));
  }
}
