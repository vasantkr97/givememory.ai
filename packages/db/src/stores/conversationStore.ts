import type { PrismaClient } from "@prisma/client";

export class ConversationStore {
  constructor(private readonly db: PrismaClient) {}

  create(id?: number) {
    return this.db.conversation.create({
      data: id ? { id } : {}
    });
  }

  list() {
    return this.db.conversation.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: {
            messages: true,
            memories: true
          }
        }
      }
    });
  }

  findById(id: number) {
    return this.db.conversation.findUnique({
      where: { id },
      include: {
        summary: true,
        _count: {
          select: {
            messages: true,
            memories: true
          }
        }
      }
    });
  }

  async touch(id: number) {
    await this.db.conversation.update({
      where: { id },
      data: { updatedAt: new Date() }
    });
  }
}
