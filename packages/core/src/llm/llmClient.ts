import type { ProviderSettingsStore } from "@recalllayer/db";
import { AsyncLocalStorage } from "node:async_hooks";
import OpenAI from "openai";

type LlmOverride = {
  provider: "openai" | "openrouter";
  apiKey: string;
  llmModel?: string;
  embeddingModel?: string;
};

const overrideStorage = new AsyncLocalStorage<LlmOverride>();

export function runWithLlmOverride<T>(override: LlmOverride, callback: () => Promise<T>) {
  return overrideStorage.run(override, callback);
}

export class LlmClient {
  constructor(private readonly settingsStore: ProviderSettingsStore) {}

  async chat(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[], options?: { temperature?: number }) {
    const settings = await this.settingsStore.get();
    const override = overrideStorage.getStore();
    const provider = override?.provider ?? settings.llmProvider;
    const apiKey = override?.apiKey ?? (settings.llmProvider === "openrouter" ? settings.openrouterApiKey : settings.openaiApiKey);
    const client = this.createClient(apiKey, provider);
    const configuredModel = override?.llmModel ?? settings.llmModel;

    const response = await client.chat.completions.create({
      model: normalizeModel(provider, configuredModel),
      messages,
      temperature: options?.temperature ?? 0
    });

    return response.choices[0]?.message?.content ?? "";
  }

  async embedding(text: string) {
    const settings = await this.settingsStore.get();
    const override = overrideStorage.getStore();
    const provider = override?.provider ?? settings.llmProvider;
    const apiKey = override?.apiKey ?? (settings.llmProvider === "openrouter" ? settings.openrouterApiKey : settings.openaiApiKey);
    const client = this.createClient(apiKey, provider);
    const configuredEmbeddingModel = override?.embeddingModel ?? settings.embeddingModel;

    const response = await client.embeddings.create({
      model: normalizeModel(provider, configuredEmbeddingModel),
      input: text
    });

    return response.data[0].embedding;
  }

  private createClient(apiKey: string | null, provider: "openai" | "openrouter") {
    if (!apiKey) {
      throw new Error(`${provider} API key is not configured`);
    }

    if (provider === "openrouter") {
      return new OpenAI({
        apiKey,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "https://recalllayer.ai",
          "X-Title": "RecallLayer.ai"
        }
      });
    }

    return new OpenAI({ apiKey });
  }
}

function normalizeModel(provider: "openai" | "openrouter", model: string) {
  if (provider === "openrouter" && !model.includes("/")) {
    return `openai/${model}`;
  }

  return model;
}
