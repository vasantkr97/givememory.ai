import type { PrismaClient } from "@prisma/client";
import { decryptStoredSecret, encryptSecret } from "../secretCrypto";

export type ProviderSettings = {
  llmProvider: "openai" | "openrouter";
  openaiApiKey: string | null;
  openrouterApiKey: string | null;
  llmModel: string;
  embeddingModel: string;
  debug: boolean;
};

export type PublicProviderSettings = {
  llmProvider: "openai" | "openrouter";
  hasOpenaiApiKey: boolean;
  hasOpenrouterApiKey: boolean;
  llmModel: string;
  embeddingModel: string;
  debug: boolean;
};

const DEFAULT_SETTINGS: ProviderSettings = {
  llmProvider: "openai",
  openaiApiKey: null,
  openrouterApiKey: null,
  llmModel: "gpt-4o-mini",
  embeddingModel: "text-embedding-3-small",
  debug: false
};

export class ProviderSettingsStore {
  constructor(private readonly db: PrismaClient) {}

  async get(): Promise<ProviderSettings> {
    const settings = await this.db.providerSettings.findUnique({
      where: { id: 1 }
    });

    const envProvider = process.env.LLM_PROVIDER === "openrouter" ? "openrouter" : "openai";

    return {
      llmProvider: settings?.llmProvider ?? envProvider,
      openaiApiKey: firstConfiguredValue(decryptStoredSecret(settings?.openaiApiKey), process.env.OPENAI_API_KEY),
      openrouterApiKey: firstConfiguredValue(decryptStoredSecret(settings?.openrouterApiKey), process.env.OPENROUTER_API_KEY),
      llmModel: settings?.llmModel ?? process.env.LLM_MODEL ?? DEFAULT_SETTINGS.llmModel,
      embeddingModel: settings?.embeddingModel ?? process.env.EMBEDDING_MODEL ?? DEFAULT_SETTINGS.embeddingModel,
      debug: settings?.debug ?? process.env.DEBUG === "true"
    };
  }

  async update(input: ProviderSettings): Promise<ProviderSettings> {
    const saved = await this.db.providerSettings.upsert({
      where: { id: 1 },
      update: {
        llmProvider: input.llmProvider,
        openaiApiKey: encryptOptionalSecret(input.openaiApiKey),
        openrouterApiKey: encryptOptionalSecret(input.openrouterApiKey),
        llmModel: input.llmModel,
        embeddingModel: input.embeddingModel,
        debug: input.debug
      },
      create: {
        id: 1,
        llmProvider: input.llmProvider,
        openaiApiKey: encryptOptionalSecret(input.openaiApiKey),
        openrouterApiKey: encryptOptionalSecret(input.openrouterApiKey),
        llmModel: input.llmModel,
        embeddingModel: input.embeddingModel,
        debug: input.debug
      }
    });

    return {
      llmProvider: saved.llmProvider,
      openaiApiKey: decryptStoredSecret(saved.openaiApiKey),
      openrouterApiKey: decryptStoredSecret(saved.openrouterApiKey),
      llmModel: saved.llmModel,
      embeddingModel: saved.embeddingModel,
      debug: saved.debug
    };
  }

  toPublic(settings: ProviderSettings): PublicProviderSettings {
    return {
      llmProvider: settings.llmProvider,
      hasOpenaiApiKey: Boolean(settings.openaiApiKey),
      hasOpenrouterApiKey: Boolean(settings.openrouterApiKey),
      llmModel: settings.llmModel,
      embeddingModel: settings.embeddingModel,
      debug: settings.debug
    };
  }
}

function encryptOptionalSecret(value: string | null) {
  return value ? encryptSecret(value) : null;
}

function firstConfiguredValue(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return null;
}
