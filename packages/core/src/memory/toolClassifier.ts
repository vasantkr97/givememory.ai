import type { Memory } from "@prisma/client";
import type { ToolAction, ToolDecision } from "@recalllayer/shared";
import type { LlmClient } from "../llm/llmClient";
import { parseJsonObject } from "../llm/json";
import { TOOL_CLASSIFIER_SYSTEM_PROMPT } from "../prompts/toolClassifierPrompt";

type RawToolDecision = {
  action?: string;
  memory_id?: number | null;
  memoryId?: number | null;
  text?: string | null;
};

const ACTIONS: ToolAction[] = ["ADD", "UPDATE", "DELETE", "REPLACE", "NOOP"];

export class ToolClassifier {
  constructor(private readonly llmClient: LlmClient) {}

  async decide(candidateFact: string, similarMemories: Memory[]): Promise<ToolDecision> {
    const memoryContext =
      similarMemories.length > 0
        ? similarMemories.map((memory) => `- ID ${memory.id}: ${memory.memoryText}`).join("\n")
        : "No existing memories found.";

    const raw = await this.llmClient.chat(
      [
        { role: "system", content: TOOL_CLASSIFIER_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Candidate fact:
${candidateFact}

Existing similar memories:
${memoryContext}

Decide the action.`
        }
      ],
      { temperature: 0 }
    );

    const parsed = parseJsonObject<RawToolDecision>(raw, {
      action: "ADD",
      memory_id: null,
      text: candidateFact
    });

    const action = normalizeAction(parsed.action);
    return {
      action,
      memoryId: parsed.memory_id ?? parsed.memoryId ?? null,
      text: action === "NOOP" || action === "DELETE" ? parsed.text ?? null : parsed.text ?? candidateFact
    };
  }
}

function normalizeAction(action: string | undefined): ToolAction {
  const normalized = action?.toUpperCase();
  return ACTIONS.includes(normalized as ToolAction) ? (normalized as ToolAction) : "ADD";
}
