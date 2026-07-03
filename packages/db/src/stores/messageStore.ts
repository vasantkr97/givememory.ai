import type { PrismaClient } from "@prisma/client";

type MessageRole = "user" | "assistant";

export class MessageStore {
  constructor(private readonly db: PrismaClient) {}

  async addPair(conversationId: number, userText: string, assistantText: string) {
    await this.db.message.createMany({
      data: [
        {
          conversationId,
          sender: "user",
          messageText: userText
        },
        {
          conversationId,
          sender: "assistant",
          messageText: assistantText
        }
      ]
    });
  }

  listByConversation(conversationId: number, limit = 100) {
    return this.db.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: "asc" },
      take: limit
    });
  }

  recent(conversationId: number, limit = 10) {
    return this.db.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: "desc" },
      take: limit
    });
  }

  count(conversationId: number) {
    return this.db.message.count({
      where: { conversationId }
    });
  }

  create(conversationId: number, role: MessageRole, content: string) {
    return this.db.message.create({
      data: {
        conversationId,
        sender: role,
        messageText: content
      }
    });
  }
}
