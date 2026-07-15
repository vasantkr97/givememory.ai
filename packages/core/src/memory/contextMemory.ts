import type {
  ConversationStore,
  MemoryStore,
  MessageStore,
  SummaryStore
} from "@givememory/db";
import type { ChatMessage, MemorySearchResponse } from "@givememory/shared";
import type { Memory } from "@prisma/client";
import type { EmbeddingService } from "../embeddings/embedText";
import type { VectorStore } from "../vector/vectorStore";
import type { BubbleCreator } from "./bubbleCreator";
import type { MemoryExtractor } from "./extractor";
import { getConnectionIds } from "./types";
import type { UpdatePhase } from "./updatePhase";
import type { SummaryGenerator } from "../summary/summaryGenerator";

export class ContextMemory {
  constructor(
    private readonly conversationStore: ConversationStore,
    private readonly messageStore: MessageStore,
    private readonly memoryStore: MemoryStore,
    private readonly summaryStore: SummaryStore,
    private readonly embeddingService: EmbeddingService,
    private readonly vectorStore: VectorStore,
    private readonly extractor: MemoryExtractor,
    private readonly updatePhase: UpdatePhase,
    private readonly bubbleCreator: BubbleCreator,
    private readonly summaryGenerator: SummaryGenerator
  ) {}

  async add(messages: ChatMessage[], conversationId: number) {
    if (messages.length < 2) {
      return { semantic: [], bubbles: [] };
    }

    const userMessage = messages[messages.length - 2];
    const assistantMessage = messages[messages.length - 1];

    if (userMessage.role !== "user" || assistantMessage.role !== "assistant") {
      throw new Error("Memory add expects the latest two messages to be user then assistant");
    }

    const summary = await this.summaryStore.findByConversation(conversationId);
    const recentMessages = await this.messageStore.recent(conversationId, 10);

    const extraction = await this.extractor.extract({
      latestPair: [`USER: ${userMessage.content}`, `ASSISTANT: ${assistantMessage.content}`],
      summaryText: summary?.summaryText ?? "",
      recentMessages: recentMessages
        .reverse()
        .map((message) => `${message.sender.toUpperCase()}: ${message.messageText}`)
    });

    await this.messageStore.addPair(conversationId, userMessage.content, assistantMessage.content);

    if (extraction.semantic.length > 0) {
      await this.updatePhase.process(extraction.semantic, conversationId);
    }

    if (extraction.bubbles.length > 0) {
      await this.bubbleCreator.create(extraction.bubbles, conversationId, null);
    }

    await this.summaryGenerator.generateIfNeeded(conversationId);
    await this.conversationStore.touch(conversationId);

    return {
      semantic: extraction.semantic,
      bubbles: extraction.bubbles.map((bubble) => bubble.text)
    };
  }

  async search(query: string, conversationId: number, limit = 10, includeConnections = true): Promise<MemorySearchResponse> {
    const queryEmbedding = await this.embeddingService.embedText(query || "stored user memories");
    const vectorResults = await this.vectorStore.search(conversationId, queryEmbedding, limit * 2);

    if (vectorResults.length === 0) {
      return { query, total: 0, results: [] };
    }

    const memories = await this.memoryStore.findManyByIds(vectorResults.map((result) => result.memoryId));
    const scoreById = new Map(vectorResults.map((result) => [result.memoryId, result.score]));
    const scored = memories.map((memory) => ({
      memory,
      score: this.scoreMemory(memory, scoreById.get(memory.id) ?? 0)
    }));

    scored.sort((left, right) => right.score - left.score);
    const topResults = scored.slice(0, limit);
    const resultIds = new Set(topResults.map((item) => item.memory.id));
    const connected: Memory[] = [];

    if (includeConnections) {
      for (const { memory } of topResults) {
        for (const connectionId of getConnectionIds(memory).slice(0, 2)) {
          if (resultIds.has(connectionId)) {
            continue;
          }

          const connection = await this.memoryStore.findById(connectionId);
          if (connection?.isActive && connection.conversationId === conversationId) {
            connected.push(connection);
            resultIds.add(connectionId);
          }
        }
      }
    }

    const results = [
      ...topResults.map(({ memory, score }) => ({
        memoryId: memory.id,
        memory: memory.memoryText,
        type: memory.isEpisodic ? ("bubble" as const) : ("semantic" as const),
        occurredAt: memory.occurredAt?.toISOString() ?? null,
        score: Number(score.toFixed(4)),
        connections: getConnectionIds(memory)
      })),
      ...connected.slice(0, 3).map((memory) => ({
        memoryId: memory.id,
        memory: memory.memoryText,
        type: "connected" as const,
        occurredAt: memory.occurredAt?.toISOString() ?? null,
        score: 0,
        connections: []
      }))
    ];

    return {
      query,
      total: results.length,
      results
    };
  }

  async update(memoryId: number, text: string) {
    const memory = await this.memoryStore.findById(memoryId);
    if (!memory) {
      throw new Error(`Memory ${memoryId} was not found`);
    }

    const embedding = await this.embeddingService.embedText(text);
    return this.memoryStore.update(memoryId, {
      memoryText: text,
      embedding
    });
  }

  async delete(memoryId: number) {
    const memory = await this.memoryStore.findById(memoryId);
    if (!memory) {
      throw new Error(`Memory ${memoryId} was not found`);
    }

    await this.memoryStore.softDelete(memoryId);
    await this.vectorStore.remove(memoryId);

    return { deletedMemoryId: memoryId };
  }

  private scoreMemory(memory: Memory, similarity: number) {
    const recency = memory.isEpisodic && memory.occurredAt ? Math.exp(-0.05 * daysBetween(memory.occurredAt, new Date())) : 1;
    return similarity * memory.importance * recency;
  }
}

function daysBetween(start: Date, end: Date): number {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86_400_000));
}
