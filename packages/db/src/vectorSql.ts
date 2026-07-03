export function toVectorLiteral(embedding: number[]): string {
  if (embedding.length !== 1536) {
    throw new Error(`Expected 1536-dimensional embedding, received ${embedding.length}`);
  }

  const values = embedding.map((value) => {
    if (!Number.isFinite(value)) {
      throw new Error("Embedding contains a non-finite value");
    }
    return String(value);
  });

  return `[${values.join(",")}]`;
}
