import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getApiPort, validateServerEnvironment } from "./config/env";

const currentDirectory = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: findNearestEnvFile(process.cwd(), currentDirectory) ?? resolve(process.cwd(), ".env") });

const { warnings } = validateServerEnvironment();
for (const warning of warnings) {
  console.warn(`Configuration warning: ${warning.message}`);
}

const [{ createApp }, { appServices }, { disconnectDatabase }] = await Promise.all([
  import("./app"),
  import("./services"),
  import("@givememory/db")
]);

const port = getApiPort();
const app = createApp();

try {
  await appServices.services.vectorStore.ensureIndexes();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`Vector indexes were not prepared: ${message}`);
  if (process.env.NODE_ENV === "production") {
    throw error;
  }
}

const server = app.listen(port, () => {
  console.log(`givememory API listening on http://localhost:${port}`);
});

async function shutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down givememory API.`);
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection", error);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception", error);
  void shutdown("uncaughtException");
});

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
