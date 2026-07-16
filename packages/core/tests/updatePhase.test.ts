import { describe, expect, mock, test } from "bun:test";
import type { Memory } from "@prisma/client";
import { UpdatePhase } from "../src/memory/updatePhase";

describe("UpdatePhase", () => {
  test("replaces stale programming language preferences before calling the LLM classifier", async () => {
    const softDelete = mock(async () => undefined);
    const create = mock(async () => memory(5, "User loves Python"));
    const decide = mock(async () => ({ action: "ADD", memoryId: null, text: "User loves Python" }));

    const phase = new UpdatePhase(
      {
        listByConversation: mock(async () => [memory(2, "User loves TypeScript")]),
        softDelete,
        create
      } as never,
      { embedText: mock(async () => [0.1, 0.2, 0.3]) } as never,
      { search: mock(async () => [memory(2, "User loves TypeScript")]) } as never,
      { decide } as never
    );

    await phase.process(["User loves Python"], 1, "but today onwards i love python");

    expect(softDelete).toHaveBeenCalledWith(2);
    expect(create).toHaveBeenCalledWith({
      conversationId: 1,
      memoryText: "User loves Python",
      embedding: [0.1, 0.2, 0.3],
      isEpisodic: false,
      importance: 0.5
    });
    expect(decide).not.toHaveBeenCalled();
  });
});

function memory(id: number, memoryText: string): Memory {
  return {
    id,
    conversationId: 1,
    memoryText,
    category: null,
    embedding: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    isEpisodic: false,
    occurredAt: null,
    sessionId: null,
    importance: 0.5,
    isActive: true
  } as Memory;
}
