import type { ChatMessage, LlmProvider } from "@givememory/shared";
import { ensurePgVector, prisma, ProviderSettingsStore } from "@givememory/db";
import { createGivememoryServices } from "./factory";

export type ConfigureInput = {
  openaiApiKey?: string | null;
  openrouterApiKey?: string | null;
  databaseUrl?: string;
  debug?: boolean;
  llmProvider?: LlmProvider;
  llmModel?: string;
  embeddingModel?: string;
};

export async function configure(input: ConfigureInput): Promise<void> {
  if (input.databaseUrl) {
    process.env.DATABASE_URL = input.databaseUrl;
  }

  const settingsStore = new ProviderSettingsStore(prisma);
  const current = await settingsStore.get();

  await settingsStore.update({
    llmProvider: input.llmProvider ?? current.llmProvider,
    openaiApiKey: input.openaiApiKey ?? current.openaiApiKey,
    openrouterApiKey: input.openrouterApiKey ?? current.openrouterApiKey,
    llmModel: input.llmModel ?? current.llmModel,
    embeddingModel: input.embeddingModel ?? current.embeddingModel,
    debug: input.debug ?? current.debug
  });
}

export async function createTable(): Promise<void> {
  await ensurePgVector();
}

export const create_table = createTable;

export function SessionLocal() {
  return prisma;
}

export function getDb() {
  return prisma;
}

export const get_db = getDb;

export function getSessionLocal() {
  return () => prisma;
}

export const get_session_local = getSessionLocal;

export class Memory {
  private readonly contextMemory = createGivememoryServices(prisma).services.contextMemory;

  constructor(_db = prisma) {}

  add(messages: ChatMessage[], conversationId: number) {
    return this.contextMemory.add(messages, conversationId);
  }

  search(query: string, conversationId: number, limit = 10, includeConnections = true) {
    return this.contextMemory.search(query, conversationId, limit, includeConnections);
  }

  update(memoryId: number, text: string) {
    return this.contextMemory.update(memoryId, text);
  }

  delete(memoryId: number) {
    return this.contextMemory.delete(memoryId);
  }
}
