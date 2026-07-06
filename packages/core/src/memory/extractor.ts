import type { ExtractionResult } from "@givememory/shared";
import { EXTRACTION_SYSTEM_PROMPT } from "../prompts/extractionPrompt";
import { parseJsonObject } from "../llm/json";
import type { LlmClient } from "../llm/llmClient";

export class MemoryExtractor {
  constructor(private readonly llmClient: LlmClient) {}

  async extract(input: {
    latestPair: string[];
    summaryText: string;
    recentMessages: string[];
  }): Promise<ExtractionResult> {
    const raw = await this.llmClient.chat(
      [
        { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Latest Interaction:
${input.latestPair.join("\n")}

Extract memory facts only from the Latest Interaction above.`
        }
      ],
      { temperature: 0.1 }
    );

    const parsed = parseJsonObject<ExtractionResult>(raw, { semantic: [], bubbles: [] });

    return {
      semantic: Array.isArray(parsed.semantic) ? parsed.semantic.filter(Boolean) : [],
      bubbles: Array.isArray(parsed.bubbles)
        ? parsed.bubbles
            .filter((bubble) => bubble && typeof bubble.text === "string" && bubble.text.trim().length > 0)
            .map((bubble) => ({
              text: bubble.text.trim(),
              importance: Number.isFinite(Number(bubble.importance)) ? Number(bubble.importance) : 0.5
            }))
        : []
    };
  }
}
