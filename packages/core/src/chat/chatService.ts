import type { ChatMessage } from "@givememory/shared";
import type { ContextMemory } from "../memory/contextMemory";
import type { LlmClient } from "../llm/llmClient";

export class ChatService {
  constructor(
    private readonly contextMemory: ContextMemory,
    private readonly llmClient: LlmClient
  ) {}

  async chat(message: string, conversationId: number) {
    const memories = await this.contextMemory.search(message, conversationId, 5, true);
    const memoriesText = memories.results.map((result) => `- [${result.type}] ${result.memory}`).join("\n") || "No memories yet.";

    const assistantMessage = await this.llmClient.chat([
      {
        role: "system",
        content: `You are a helpful AI assistant with access to the user's long-term memories.

User Memories:
${memoriesText}

Use memories when they are relevant. Do not mention memory mechanics unless asked.`
      },
      { role: "user", content: message }
    ]);

    const messages: ChatMessage[] = [
      { role: "user", content: message },
      { role: "assistant", content: assistantMessage }
    ];

    const extracted = await this.contextMemory.add(messages, conversationId);

    return {
      message: assistantMessage,
      memories,
      extracted
    };
  }
}
