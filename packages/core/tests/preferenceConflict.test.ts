import { describe, expect, test } from "bun:test";
import type { Memory } from "@prisma/client";
import { findStalePreferenceMemories, findSupersededPreferenceMemories } from "../src/memory/preferenceConflict";

describe("preference conflict detection", () => {
  test("marks an older programming language preference stale when the user gives a new direct preference", () => {
    const stale = findStalePreferenceMemories(
      "User loves Python",
      [memory(2, "User loves TypeScript")],
      "i love python"
    );

    expect(stale.map((item) => item.id)).toEqual([2]);
  });

  test("uses recency language from the source message even when the extracted fact is simplified", () => {
    const stale = findStalePreferenceMemories(
      "User loves Python",
      [memory(2, "User loves TypeScript")],
      "but today onwards i love the python language"
    );

    expect(stale.map((item) => item.id)).toEqual([2]);
  });

  test("does not replace when the user is explicitly adding another language preference", () => {
    const stale = findStalePreferenceMemories(
      "User loves Python",
      [memory(2, "User loves TypeScript")],
      "i also love python"
    );

    expect(stale).toEqual([]);
  });

  test("finds older active preference memories that are superseded by a newer same-slot preference", () => {
    const older = memory(2, "User loves TypeScript", new Date("2026-01-01T00:00:00Z"));
    const newer = memory(5, "User loves Python", new Date("2026-01-02T00:00:00Z"));

    const stale = findSupersededPreferenceMemories([older, newer]);

    expect(stale.map((item) => item.id)).toEqual([2]);
  });
});

function memory(id: number, memoryText: string, updatedAt = new Date()): Memory {
  return {
    id,
    conversationId: 1,
    memoryText,
    category: null,
    embedding: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt,
    isEpisodic: false,
    occurredAt: null,
    sessionId: null,
    importance: 0.5,
    isActive: true
  } as Memory;
}
