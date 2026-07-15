import { describe, expect, mock, test } from "bun:test";
import type { PrismaClient } from "@prisma/client";
import { MemoryStore } from "../src/stores/memoryStore";

describe("MemoryStore ownership", () => {
  test("scopes connected-memory lookups to the current conversation", async () => {
    const findMany = mock(async () => []);
    const db = { memory: { findMany } } as unknown as PrismaClient;
    const store = new MemoryStore(db);

    await store.findManyByIds([1, 2, 3], 44);

    expect(findMany).toHaveBeenCalledWith({
      where: {
        id: { in: [1, 2, 3] },
        conversationId: 44,
        isActive: true
      }
    });
  });
});
