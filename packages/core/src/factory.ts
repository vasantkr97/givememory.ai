import {
  ConversationStore,
  MemoryStore,
  MessageStore,
  ProviderSettingsStore,
  SummaryStore
} from "@recalllayer/db";
import type { PrismaClient } from "@prisma/client";
import { EmbeddingService } from "./embeddings/embedText";
import { LlmClient } from "./llm/llmClient";
import { BubbleCreator } from "./memory/bubbleCreator";
import { ConnectionFinder } from "./memory/connectionFinder";
import { ContextMemory } from "./memory/contextMemory";
import { MemoryExtractor } from "./memory/extractor";
import { SimilarMemorySearch } from "./memory/similarMemorySearch";
import { ToolClassifier } from "./memory/toolClassifier";
import { UpdatePhase } from "./memory/updatePhase";
import { SummaryGenerator } from "./summary/summaryGenerator";
import { PgVectorStore } from "./vector/vectorStore";
import { ChatService } from "./chat/chatService";

export function createRecallLayerServices(db: PrismaClient) {
  const conversationStore = new ConversationStore(db);
  const messageStore = new MessageStore(db);
  const memoryStore = new MemoryStore(db);
  const summaryStore = new SummaryStore(db);
  const providerSettingsStore = new ProviderSettingsStore(db);

  const llmClient = new LlmClient(providerSettingsStore);
  const embeddingService = new EmbeddingService(llmClient);
  const vectorStore = new PgVectorStore(db);
  const extractor = new MemoryExtractor(llmClient);
  const toolClassifier = new ToolClassifier(llmClient);
  const similarMemorySearch = new SimilarMemorySearch(memoryStore, vectorStore);
  const updatePhase = new UpdatePhase(memoryStore, embeddingService, similarMemorySearch, toolClassifier);
  const connectionFinder = new ConnectionFinder(memoryStore, vectorStore);
  const bubbleCreator = new BubbleCreator(memoryStore, embeddingService, connectionFinder);
  const summaryGenerator = new SummaryGenerator(messageStore, summaryStore, llmClient);

  const contextMemory = new ContextMemory(
    conversationStore,
    messageStore,
    memoryStore,
    summaryStore,
    embeddingService,
    vectorStore,
    extractor,
    updatePhase,
    bubbleCreator,
    summaryGenerator
  );

  const chatService = new ChatService(contextMemory, llmClient);

  return {
    stores: {
      conversationStore,
      messageStore,
      memoryStore,
      providerSettingsStore,
      summaryStore
    },
    services: {
      contextMemory,
      chatService,
      embeddingService,
      llmClient,
      vectorStore
    }
  };
}
