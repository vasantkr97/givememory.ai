import type { LlmClient } from "../llm/llmClient";

export class EmbeddingService {
  constructor(private readonly llmClient: LlmClient) {}

  embedText(text: string): Promise<number[]> {
    return this.llmClient.embedding(text);
  }
}
