import { z } from "zod";

export const messageRoleSchema = z.enum(["user", "assistant"]);
export const llmProviderSchema = z.enum(["openai", "openrouter"]);

export const chatMessageSchema = z.object({
  role: messageRoleSchema,
  content: z.string().min(1).max(8000)
});

export const createConversationSchema = z.object({
  id: z.number().int().positive().optional()
});

export const addMemorySchema = z.object({
  conversationId: z.number().int().positive(),
  messages: z.array(chatMessageSchema).min(2).max(100)
});

export const searchMemorySchema = z.object({
  conversationId: z.number().int().positive(),
  query: z.string().min(1).max(1000),
  limit: z.number().int().positive().max(50).default(10),
  includeConnections: z.boolean().default(true)
});

export const updateMemorySchema = z.object({
  text: z.string().min(1).max(8000)
});

export const chatSchema = z.object({
  conversationId: z.number().int().positive(),
  message: z.string().min(1).max(8000)
});

export const providerSettingsSchema = z.object({
  llmProvider: llmProviderSchema,
  openaiApiKey: z.string().optional().nullable(),
  openrouterApiKey: z.string().optional().nullable(),
  llmModel: z.string().min(1),
  embeddingModel: z.string().min(1),
  debug: z.boolean().default(false)
});

export const signUpSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128)
});

export const signInSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128)
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1)
});

export const apiKeySchema = z.object({
  api_key: z.string().min(10).max(512)
});

export const productChatSchema = z.object({
  message: z.string().min(1).max(8000)
});

export type AddMemoryInput = z.infer<typeof addMemorySchema>;
export type SearchMemoryInput = z.infer<typeof searchMemorySchema>;
export type ChatInput = z.infer<typeof chatSchema>;
export type ProviderSettingsInput = z.infer<typeof providerSettingsSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ProductChatInput = z.infer<typeof productChatSchema>;
