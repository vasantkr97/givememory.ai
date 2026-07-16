import type { BubbleCandidate } from "@recalllayer/shared";
import type { MemoryStore } from "@recalllayer/db";
import type { Memory } from "@prisma/client";
import type { EmbeddingService } from "../embeddings/embedText";
import type { ConnectionFinder } from "./connectionFinder";

export class BubbleCreator {
  constructor(
    private readonly memoryStore: MemoryStore,
    private readonly embeddingService: EmbeddingService,
    private readonly connectionFinder: ConnectionFinder
  ) {}

  async create(bubbles: BubbleCandidate[], conversationId: number, sessionId?: number | null): Promise<Memory[]> {
    const created: Memory[] = [];

    for (const bubble of bubbles) {
      const embedding = await this.embeddingService.embedText(bubble.text);
      const memory = await this.memoryStore.create({
        conversationId,
        memoryText: bubble.text,
        embedding,
        isEpisodic: true,
        occurredAt: new Date(),
        sessionId: sessionId ?? null,
        importance: clampImportance(bubble.importance),
        isActive: true,
        metadata: {}
      });

      if (memory) {
        await this.connectionFinder.findAndPersist(memory, embedding, conversationId);
        created.push(memory);
      }
    }

    return created;
  }
}

function clampImportance(importance: number): number {
  if (!Number.isFinite(importance)) {
    return 0.5;
  }

  return Math.max(0, Math.min(1, importance));
}
