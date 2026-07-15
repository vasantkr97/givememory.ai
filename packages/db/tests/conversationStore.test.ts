import { describe, expect, mock, test } from "bun:test";
import type { PrismaClient } from "@prisma/client";
import { ConversationStore } from "../src/stores/conversationStore";

describe("ConversationStore ownership", () => {
  test("gets or creates a conversation by userId instead of reusing the user numeric id", async () => {
    const upsert = mock(async () => ({ id: 91, userId: 7 }));
    const db = { conversation: { upsert } } as unknown as PrismaClient;
    const store = new ConversationStore(db);

    await store.getOrCreateForUser(7);

    expect(upsert).toHaveBeenCalledWith({
      where: { userId: 7 },
      create: { userId: 7 },
      update: {}
    });
  });

  test("checks both user and conversation ids when authorizing access", async () => {
    const findFirst = mock(async () => null);
    const db = { conversation: { findFirst } } as unknown as PrismaClient;
    const store = new ConversationStore(db);

    await store.findOwnedById(7, 91);

    expect(findFirst).toHaveBeenCalledWith({ where: { id: 91, userId: 7 } });
  });
});
