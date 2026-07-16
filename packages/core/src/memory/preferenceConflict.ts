import type { Memory } from "@prisma/client";

const PROGRAMMING_LANGUAGES = new Set([
  "python",
  "typescript",
  "javascript",
  "java",
  "go",
  "golang",
  "rust",
  "c",
  "c++",
  "c#",
  "ruby",
  "php",
  "swift",
  "kotlin",
  "dart",
  "scala",
  "elixir",
  "clojure"
]);

type PreferenceStatement = {
  bucket: "preference";
  domain: "programming-language";
  value: string;
};

export function findStalePreferenceMemories(candidateFact: string, memories: Memory[], sourceText = "") {
  const candidate = parsePreference(candidateFact);
  if (!candidate || isAdditivePreference(sourceText)) {
    return [];
  }

  const shouldReplace = hasReplacementIntent(sourceText) || isDirectPreferenceStatement(sourceText);
  if (!shouldReplace) {
    return [];
  }

  return memories.filter((memory) => {
    if (memory.isEpisodic || !memory.isActive) {
      return false;
    }

    const existing = parsePreference(memory.memoryText);
    return Boolean(
      existing &&
      existing.bucket === candidate.bucket &&
      existing.domain === candidate.domain &&
      existing.value !== candidate.value
    );
  });
}

export function findSupersededPreferenceMemories(memories: Memory[]) {
  const latestBySlot = new Map<string, Memory>();
  const stale: Memory[] = [];

  for (const memory of memories) {
    if (memory.isEpisodic || !memory.isActive) {
      continue;
    }

    const preference = parsePreference(memory.memoryText);
    if (!preference) {
      continue;
    }

    const key = `${preference.bucket}:${preference.domain}`;
    const current = latestBySlot.get(key);
    if (!current) {
      latestBySlot.set(key, memory);
      continue;
    }

    if (isNewer(memory, current)) {
      stale.push(current);
      latestBySlot.set(key, memory);
    } else {
      stale.push(memory);
    }
  }

  return stale;
}

function parsePreference(text: string): PreferenceStatement | null {
  const normalized = normalizeText(text)
    .replace(/^user\s+(now|currently|today onwards|from now on)\s+/, "user ")
    .replace(/\s+language$/, "");

  const match = normalized.match(/^user\s+(?:really\s+)?(?:loves|likes|prefers|enjoys)\s+(.+)$/);
  if (!match) {
    return null;
  }

  const value = normalizeValue(match[1]);
  if (!PROGRAMMING_LANGUAGES.has(value)) {
    return null;
  }

  return {
    bucket: "preference",
    domain: "programming-language",
    value
  };
}

function isNewer(left: Memory, right: Memory) {
  const leftTime = left.updatedAt?.getTime() ?? left.createdAt.getTime();
  const rightTime = right.updatedAt?.getTime() ?? right.createdAt.getTime();
  return leftTime >= rightTime;
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeValue(value: string) {
  return value
    .toLowerCase()
    .replace(/\b(programming|language|lang)\b/g, "")
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasReplacementIntent(text: string) {
  const normalized = normalizeText(text);
  return /\b(today onwards|from now on|from today|now i|nowadays|these days|instead|no longer|but now|but today)\b/.test(normalized);
}

function isAdditivePreference(text: string) {
  const normalized = normalizeText(text);
  return /\b(also|too|as well|along with|in addition)\b/.test(normalized);
}

function isDirectPreferenceStatement(text: string) {
  const normalized = normalizeText(text);
  return /\bi\s+(really\s+)?(love|like|prefer|enjoy)\s+\w+/.test(normalized);
}
