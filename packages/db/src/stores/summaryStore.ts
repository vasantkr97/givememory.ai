import type { PrismaClient } from "@prisma/client";

export class SummaryStore {
  constructor(private readonly db: PrismaClient) {}

  findByConversation(conversationId: number) {
    return this.db.conversationSummary.findUnique({
      where: { conversationId }
    });
  }

  upsert(conversationId: number, summaryText: string) {
    return this.db.conversationSummary.upsert({
      where: { conversationId },
      update: { summaryText },
      create: {
        conversationId,
        summaryText
      }
    });
  }
}
