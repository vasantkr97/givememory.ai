import type { NextFunction, Request, Response } from "express";
import { prisma } from "@givememory/db";
import { isAdminEmail } from "../config/env";
import { decodeToken, decryptApiKey } from "./crypto";

export const FREE_MESSAGE_LIMIT = 10;

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  messageCount: number;
  createdAt: Date;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      effectiveApiKey?: string | null;
    }
  }
}

export function toPublicUser(user: AuthUser, hasApiKey: boolean) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    is_admin: isAdminEmail(user.email),
    is_active: true,
    created_at: user.createdAt.toISOString(),
    usage: {
      free_messages_remaining: Math.max(0, FREE_MESSAGE_LIMIT - user.messageCount),
      free_message_limit: FREE_MESSAGE_LIMIT,
      message_count: user.messageCount,
      has_api_key: hasApiKey
    }
  };
}

export async function getUserApiKey(userId: number) {
  const record = await prisma.userApiKey.findFirst({
    where: { userId, isValid: true }
  });

  if (!record) {
    return null;
  }

  try {
    return decryptApiKey(record.encryptedApiKey);
  } catch {
    return null;
  }
}

export async function authenticate(request: Request, response: Response, next: NextFunction) {
  const header = request.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token) {
    response.status(401).json({ detail: "Not authenticated" });
    return;
  }

  const payload = decodeToken(token);
  if (!payload || payload.type !== "access" || typeof payload.sub !== "string") {
    response.status(401).json({ detail: "Invalid or expired token" });
    return;
  }

  const user = await prisma.user.findFirst({
    where: { id: Number(payload.sub), isActive: true }
  });

  if (!user) {
    response.status(401).json({ detail: "User not found or inactive" });
    return;
  }

  request.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    messageCount: user.messageCount,
    createdAt: user.createdAt
  };
  next();
}

export async function requireApiKeyOrFreeTier(request: Request, response: Response, next: NextFunction) {
  if (!request.user) {
    response.status(401).json({ detail: "Not authenticated" });
    return;
  }

  const apiKey = await getUserApiKey(request.user.id);
  if (apiKey) {
    request.effectiveApiKey = apiKey;
    next();
    return;
  }

  if (request.user.messageCount < FREE_MESSAGE_LIMIT) {
    request.effectiveApiKey = null;
    next();
    return;
  }

  response.status(403).json({
    detail: {
      code: "API_KEY_REQUIRED",
      message: "Free trial expired. Please add your OpenRouter API key to continue.",
      free_messages_used: request.user.messageCount,
      free_message_limit: FREE_MESSAGE_LIMIT
    }
  });
}

export function requireAdmin(request: Request, response: Response, next: NextFunction) {
  if (!request.user) {
    response.status(401).json({ detail: "Not authenticated" });
    return;
  }

  if (!isAdminEmail(request.user.email)) {
    response.status(403).json({ detail: "Admin access required" });
    return;
  }

  next();
}
