import { Prisma, type PrismaClient } from "@prisma/client";
import { toVectorLiteral } from "../vectorSql";

export type CreateMemoryInput = {
  conversationId: number;
  memoryText: string;
  category?: string | null;
  embedding?: number[] | null;
  metadata?: Prisma.InputJsonValue | null;
  isEpisodic?: boolean;
  occurredAt?: Date | null;
  sessionId?: number | null;
  importance?: number;
  isActive?: boolean;
};

export type UpdateMemoryInput = Partial<{
  memoryText: string;
  category: string | null;
  embedding: number[] | null;
  metadata: Prisma.InputJsonValue | null;
  isEpisodic: boolean;
  occurredAt: Date | null;
  sessionId: number | null;
  importance: number;
  isActive: boolean;
}>;

export class MemoryStore {
  constructor(private readonly db: PrismaClient) {}

  async create(input: CreateMemoryInput) {
    const memory = await this.db.memory.create({
      data: {
        conversationId: input.conversationId,
        memoryText: input.memoryText,
        category: input.category ?? null,
        metadata: input.metadata === null ? Prisma.JsonNull : input.metadata ?? undefined,
        isEpisodic: input.isEpisodic ?? false,
        occurredAt: input.occurredAt ?? null,
        sessionId: input.sessionId ?? null,
        importance: input.importance ?? 0.5,
        isActive: input.isActive ?? true
      }
    });

    if (input.embedding) {
      await this.setEmbedding(memory.id, input.embedding);
    }

    return this.findById(memory.id);
  }

  findById(id: number) {
    return this.db.memory.findUnique({
      where: { id }
    });
  }

  listByConversation(conversationId: number, options?: { includeInactive?: boolean; limit?: number }) {
    return this.db.memory.findMany({
      where: {
        conversationId,
        ...(options?.includeInactive ? {} : { isActive: true })
      },
      orderBy: { updatedAt: "desc" },
      take: options?.limit ?? 100
    });
  }

  findManyByIds(ids: number[], conversationId?: number) {
    return this.db.memory.findMany({
      where: {
        id: { in: ids },
        ...(conversationId === undefined ? {} : { conversationId }),
        isActive: true
      }
    });
  }

  async update(id: number, input: UpdateMemoryInput) {
    const { embedding, ...data } = input;
    const updateData: Prisma.MemoryUpdateInput = {
      ...data,
      metadata: data.metadata === null ? Prisma.JsonNull : data.metadata
    };

    await this.db.memory.update({
      where: { id },
      data: updateData
    });

    if (embedding) {
      await this.setEmbedding(id, embedding);
    }

    return this.findById(id);
  }

  softDelete(id: number) {
    return this.db.memory.update({
      where: { id },
      data: { isActive: false }
    });
  }

  hardDelete(id: number) {
    return this.db.memory.delete({
      where: { id }
    });
  }

  async setEmbedding(memoryId: number, embedding: number[]) {
    const vector = toVectorLiteral(embedding);
    await this.db.$executeRawUnsafe(
      "UPDATE memories SET embedding = $1::vector WHERE id = $2",
      vector,
      memoryId
    );
  }
}
