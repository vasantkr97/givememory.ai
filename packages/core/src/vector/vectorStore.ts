import type { PrismaClient } from "@prisma/client";
import { toVectorLiteral } from "@recalllayer/db";

export interface VectorResult {
  memoryId: number;
  score: number;
}

export interface VectorStore {
  search(conversationId: number, embedding: number[], limit: number): Promise<VectorResult[]>;
  remove(memoryId: number): Promise<void>;
}

export class PgVectorStore implements VectorStore {
  constructor(private readonly db: PrismaClient) {}

  async ensureIndexes(): Promise<void> {
    await this.db.$executeRawUnsafe("CREATE EXTENSION IF NOT EXISTS vector");
    await this.db.$executeRawUnsafe(
      "CREATE INDEX IF NOT EXISTS memories_embedding_hnsw_idx ON memories USING hnsw (embedding vector_cosine_ops)"
    );
  }

  async search(conversationId: number, embedding: number[], limit: number): Promise<VectorResult[]> {
    const vector = toVectorLiteral(embedding);
    const rows = await this.db.$queryRawUnsafe<Array<{ memory_id: number; score: number }>>(
      `SELECT id AS memory_id, 1 - (embedding <=> $1::vector) AS score
       FROM memories
       WHERE conversation_id = $2 AND is_active = true AND embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      vector,
      conversationId,
      limit
    );

    return rows.map((row) => ({
      memoryId: row.memory_id,
      score: Number(row.score)
    }));
  }

  async remove(memoryId: number): Promise<void> {
    await this.db.$executeRawUnsafe("UPDATE memories SET embedding = NULL WHERE id = $1", memoryId);
  }
}
