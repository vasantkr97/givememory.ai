import type { MemoryStore } from "@recalllayer/db";
import type { EmbeddingService } from "../embeddings/embedText";
import type { SimilarMemorySearch } from "./similarMemorySearch";
import type { ToolClassifier } from "./toolClassifier";
import { findStalePreferenceMemories } from "./preferenceConflict";

export class UpdatePhase {
  constructor(
    private readonly memoryStore: MemoryStore,
    private readonly embeddingService: EmbeddingService,
    private readonly similarMemorySearch: SimilarMemorySearch,
    private readonly toolClassifier: ToolClassifier
  ) {}

  async process(candidateFacts: string[], conversationId: number, sourceText = ""): Promise<void> {
    for (const fact of candidateFacts) {
      const embedding = await this.embeddingService.embedText(fact);
      const similarMemories = await this.similarMemorySearch.search(conversationId, embedding, 10);
      const activeMemories = await this.memoryStore.listByConversation(conversationId, { limit: 200 });
      const stalePreferences = findStalePreferenceMemories(fact, activeMemories, sourceText);

      if (stalePreferences.length > 0) {
        for (const memory of stalePreferences) {
          await this.memoryStore.softDelete(memory.id);
        }

        await this.memoryStore.create({
          conversationId,
          memoryText: fact,
          embedding,
          isEpisodic: false,
          importance: 0.5
        });
        continue;
      }

      const decision = await this.toolClassifier.decide(fact, similarMemories);

      if (decision.action === "ADD") {
        await this.memoryStore.create({
          conversationId,
          memoryText: decision.text ?? fact,
          embedding,
          isEpisodic: false,
          importance: 0.5
        });
      }

      if (decision.action === "UPDATE" && decision.memoryId) {
        await this.memoryStore.update(decision.memoryId, {
          memoryText: decision.text ?? fact,
          embedding
        });
      }

      if (decision.action === "DELETE" && decision.memoryId) {
        await this.memoryStore.softDelete(decision.memoryId);
      }

      if (decision.action === "REPLACE" && decision.memoryId) {
        await this.memoryStore.softDelete(decision.memoryId);
        await this.memoryStore.create({
          conversationId,
          memoryText: decision.text ?? fact,
          embedding,
          isEpisodic: false,
          importance: 0.5
        });
      }
    }
  }
}
