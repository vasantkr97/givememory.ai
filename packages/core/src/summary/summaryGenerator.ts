import type { MessageStore, SummaryStore } from "@givememory/db";
import type { LlmClient } from "../llm/llmClient";
import { SUMMARY_GENERATOR_PROMPT } from "../prompts/summaryPrompt";

const MAX_MESSAGES_FROM_SUMMARY = 200;
const SUMMARY_TRIGGER_COUNT = 20;

export class SummaryGenerator {
  constructor(
    private readonly messageStore: MessageStore,
    private readonly summaryStore: SummaryStore,
    private readonly llmClient: LlmClient
  ) {}

  async generateIfNeeded(conversationId: number): Promise<string> {
    const totalCount = await this.messageStore.count(conversationId);
    if (totalCount === 0 || totalCount % SUMMARY_TRIGGER_COUNT !== 0) {
      return "";
    }

    const messages = await this.messageStore.listByConversation(conversationId, MAX_MESSAGES_FROM_SUMMARY);
    const conversationText = messages.map((message) => `${message.sender.toUpperCase()}: ${message.messageText}`).join("\n");

    const summary = (
      await this.llmClient.chat(
        [
          { role: "system", content: SUMMARY_GENERATOR_PROMPT },
          {
            role: "user",
            content: `Summarize the following conversation.

Conversation:
${conversationText}`
          }
        ],
        { temperature: 0.2 }
      )
    ).trim();

    if (summary) {
      await this.summaryStore.upsert(conversationId, summary);
    }

    return summary;
  }
}
