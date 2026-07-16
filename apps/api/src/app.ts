import express from "express";
import morgan from "morgan";
import { prisma } from "@recalllayer/db";
import { getJsonBodyLimit, getRateLimitConfig, getTrustProxy, isProduction } from "./config/env";
import { apiKeyRoutes } from "./routes/apiKeyRoutes";
import { authRoutes } from "./routes/authRoutes";
import { chatRoutes } from "./routes/chatRoutes";
import { conversationRoutes } from "./routes/conversationRoutes";
import { memoriesRoutes, memoryRoutes } from "./routes/memoryRoutes";
import { settingsRoutes } from "./routes/settingsRoutes";
import { errorHandler } from "./middleware/errorHandler";
import { asyncHandler } from "./middleware/asyncHandler";
import { createRateLimiter } from "./middleware/rateLimit";
import { corsMiddleware, noStore, requestId, securityHeaders } from "./middleware/security";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", getTrustProxy());

  app.use(requestId());
  app.use(securityHeaders());
  app.use(corsMiddleware());
  app.use(express.json({ limit: getJsonBodyLimit() }));
  app.use(noStore());
  app.use(morgan(isProduction() ? "combined" : "dev"));

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok", name: "recalllayer-api" });
  });

  app.get(
    "/api/ready",
    asyncHandler(async (_request, response) => {
      await prisma.$queryRaw`SELECT 1`;
      response.json({ status: "ready", database: "ok" });
    })
  );

  app.use(createRateLimiter({ keyPrefix: "global", ...getRateLimitConfig("GLOBAL") }));
  app.use("/api/auth", createRateLimiter({ keyPrefix: "auth", ...getRateLimitConfig("AUTH") }), authRoutes);
  app.use("/api/api-keys", createRateLimiter({ keyPrefix: "api-key", ...getRateLimitConfig("API_KEY") }), apiKeyRoutes);
  app.use("/api/memories", memoriesRoutes);
  app.use("/api/conversations", conversationRoutes);
  app.use("/api/memory", memoryRoutes);
  app.use("/api/chat", createRateLimiter({ keyPrefix: "chat", ...getRateLimitConfig("CHAT") }), chatRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use(errorHandler);

  return app;
}
