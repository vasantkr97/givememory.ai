import { Router } from "express";
import { providerSettingsSchema } from "@recalllayer/shared";
import { appServices } from "../services";
import { authenticate, requireAdmin } from "../auth/middleware";
import { asyncHandler } from "../middleware/asyncHandler";

export const settingsRoutes = Router();

settingsRoutes.use(authenticate, requireAdmin);

settingsRoutes.get(
  "/",
  asyncHandler(async (_request, response) => {
    const settings = await appServices.stores.providerSettingsStore.get();
    response.json({
      settings: appServices.stores.providerSettingsStore.toPublic(settings)
    });
  })
);

settingsRoutes.put(
  "/",
  asyncHandler(async (request, response) => {
    const current = await appServices.stores.providerSettingsStore.get();
    const input = providerSettingsSchema.partial().parse(request.body);

    const nextSettings = {
      llmProvider: input.llmProvider ?? current.llmProvider,
      openaiApiKey: normalizeApiKey(input.openaiApiKey, current.openaiApiKey),
      openrouterApiKey: normalizeApiKey(input.openrouterApiKey, current.openrouterApiKey),
      llmModel: input.llmModel ?? current.llmModel,
      embeddingModel: input.embeddingModel ?? current.embeddingModel,
      debug: input.debug ?? current.debug
    };

    validateProviderSettings(nextSettings);

    const settings = await appServices.stores.providerSettingsStore.update(nextSettings);

    response.json({
      settings: appServices.stores.providerSettingsStore.toPublic(settings)
    });
  })
);

function normalizeApiKey(input: string | null | undefined, current: string | null): string | null {
  if (input === null) {
    return null;
  }

  const trimmed = input?.trim();

  if (trimmed === undefined || trimmed === "") {
    return current;
  }

  return trimmed;
}

function validateProviderSettings(settings: {
  llmProvider: "openai" | "openrouter";
  openaiApiKey: string | null;
  openrouterApiKey: string | null;
}) {
  if (settings.llmProvider === "openrouter" && !settings.openrouterApiKey?.startsWith("sk-or-v1-")) {
    throw new Error("OpenRouter API key must start with sk-or-v1-");
  }

  if (settings.llmProvider === "openai" && !settings.openaiApiKey?.startsWith("sk-")) {
    throw new Error("OpenAI API key must start with sk-");
  }
}
