export function parseJsonObject<T>(rawOutput: string, fallback: T): T {
  const trimmed = rawOutput.trim();
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const jsonText = (codeBlockMatch?.[1] ?? trimmed).trim();

  try {
    return JSON.parse(jsonText) as T;
  } catch {
    return fallback;
  }
}
