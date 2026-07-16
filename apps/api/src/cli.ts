import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateServerEnvironment } from "./config/env";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: findNearestEnvFile(process.cwd(), currentDirectory) ?? resolve(process.cwd(), ".env") });

validateServerEnvironment();

const [{ prisma }, { createRecallLayerServices }] = await Promise.all([
  import("@recalllayer/db"),
  import("@recalllayer/core")
]);

const services = createRecallLayerServices(prisma);
const terminal = createInterface({ input, output });

async function main() {
  await services.services.vectorStore.ensureIndexes();

  const existingId = (await terminal.question("Enter conversation ID, or press Enter for a new one: ")).trim();
  const conversation = existingId ? await services.stores.conversationStore.findById(Number(existingId)) : null;
  const conversationId = conversation?.id ?? (await services.stores.conversationStore.create()).id;

  console.log(`Chat started for conversation ${conversationId}. Type "exit" to quit.`);
  console.log('Type "memories" to print stored memories.');

  while (true) {
    const message = (await terminal.question("\nYou: ")).trim();
    if (!message) {
      continue;
    }

    if (message.toLowerCase() === "exit") {
      break;
    }

    if (message.toLowerCase() === "memories") {
      const memories = await services.stores.memoryStore.listByConversation(conversationId, { limit: 50 });
      for (const memory of memories) {
        console.log(`[${memory.id}] ${memory.memoryText}`);
      }
      continue;
    }

    const response = await services.services.chatService.chat(message, conversationId);
    console.log(`AI: ${response.message}`);
  }
}

try {
  await main();
} finally {
  terminal.close();
  await prisma.$disconnect();
}

function findNearestEnvFile(...starts: string[]) {
  for (const start of starts) {
    let directory = start;
    for (let depth = 0; depth < 8; depth += 1) {
      const candidate = resolve(directory, ".env");
      if (existsSync(candidate)) {
        return candidate;
      }
      const parent = dirname(directory);
      if (parent === directory) {
        break;
      }
      directory = parent;
    }
  }

  return null;
}
