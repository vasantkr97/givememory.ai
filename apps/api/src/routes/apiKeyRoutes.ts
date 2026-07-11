import { Router } from "express";
import { prisma } from "@givememory/db";
import { apiKeySchema } from "@givememory/shared";
import { authenticate, getUserApiKey } from "../auth/middleware";
import { encryptApiKey } from "../auth/crypto";
import { asyncHandler } from "../middleware/asyncHandler";

export const apiKeyRoutes = Router();

async function validateOpenRouterKey(apiKey: string) {
  if (!apiKey.startsWith("sk-or-v1-")) {
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const result = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal
    });
    return result.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

apiKeyRoutes.post(
  "/validate",
  authenticate,
  asyncHandler(async (request, response) => {
    const input = apiKeySchema.parse(request.body);
    const valid = await validateOpenRouterKey(input.api_key);
    response.json({
      valid,
      message: valid ? "API key is valid" : "API key could not be validated"
    });
  })
);

apiKeyRoutes.post(
  "/",
  authenticate,
  asyncHandler(async (request, response) => {
    const input = apiKeySchema.parse(request.body);
    const valid = await validateOpenRouterKey(input.api_key);
    if (!valid) {
      response.status(400).json({ detail: "Invalid OpenRouter API key" });
      return;
    }

    await prisma.userApiKey.upsert({
      where: { userId: request.user!.id },
      create: {
        userId: request.user!.id,
        encryptedApiKey: encryptApiKey(input.api_key),
        isValid: true
      },
      update: {
        encryptedApiKey: encryptApiKey(input.api_key),
        isValid: true
      }
    });

    response.json({ message: "API key saved" });
  })
);

apiKeyRoutes.get(
  "/status",
  authenticate,
  asyncHandler(async (request, response) => {
    const apiKey = await getUserApiKey(request.user!.id);
    response.json({
      has_key: Boolean(apiKey),
      is_valid: Boolean(apiKey)
    });
  })
);

apiKeyRoutes.delete(
  "/",
  authenticate,
  asyncHandler(async (request, response) => {
    await prisma.userApiKey.deleteMany({ where: { userId: request.user!.id } });
    response.json({ message: "API key deleted" });
  })
);
