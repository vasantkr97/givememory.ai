import { Router } from "express";
import { prisma } from "@recalllayer/db";
import { refreshTokenSchema, signInSchema, signUpSchema } from "@recalllayer/shared";
import { asyncHandler } from "../middleware/asyncHandler";
import { appServices } from "../services";
import { authenticate, getUserApiKey, toPublicUser } from "../auth/middleware";
import {
  ACCESS_TOKEN_EXPIRE_SECONDS,
  createAccessToken,
  createRefreshToken,
  hashPassword,
  hashToken,
  verifyPassword
} from "../auth/crypto";

export const authRoutes = Router();

async function issueAuthResponse(user: { id: number; name: string; email: string; messageCount: number; createdAt: Date }) {
  const accessToken = createAccessToken(user.id, user.email);
  const refresh = createRefreshToken(user.id);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refresh.token),
      expiresAt: refresh.expiresAt
    }
  });

  const hasApiKey = Boolean(await getUserApiKey(user.id));
  return {
    access_token: accessToken,
    refresh_token: refresh.token,
    token_type: "bearer" as const,
    expires_in: ACCESS_TOKEN_EXPIRE_SECONDS,
    user: toPublicUser(user, hasApiKey)
  };
}

authRoutes.post(
  "/signup",
  asyncHandler(async (request, response) => {
    const input = signUpSchema.parse(request.body);
    const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (existing) {
      response.status(400).json({ detail: "Email already registered" });
      return;
    }

    const user = await prisma.$transaction(async (transaction) => {
      const createdUser = await transaction.user.create({
        data: {
          name: input.name,
          email: input.email.toLowerCase(),
          hashedPassword: hashPassword(input.password)
        }
      });

      await transaction.conversation.create({
        data: { userId: createdUser.id }
      });

      return createdUser;
    });

    response.json(await issueAuthResponse(user));
  })
);

authRoutes.post(
  "/signin",
  asyncHandler(async (request, response) => {
    const input = signInSchema.parse(request.body);
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (!user || !user.isActive || !verifyPassword(input.password, user.hashedPassword)) {
      response.status(401).json({ detail: "Invalid email or password" });
      return;
    }

    await appServices.stores.conversationStore.getOrCreateForUser(user.id);

    response.json(await issueAuthResponse(user));
  })
);

authRoutes.post(
  "/logout",
  asyncHandler(async (request, response) => {
    const input = refreshTokenSchema.safeParse(request.body);
    if (input.success) {
      await prisma.refreshToken.deleteMany({
        where: { tokenHash: hashToken(input.data.refresh_token) }
      });
    }
    response.json({ message: "Logged out" });
  })
);

authRoutes.post(
  "/refresh",
  asyncHandler(async (request, response) => {
    const input = refreshTokenSchema.parse(request.body);
    const tokenHash = hashToken(input.refresh_token);
    const record = await prisma.refreshToken.findFirst({
      where: { tokenHash, expiresAt: { gt: new Date() } },
      include: { user: true }
    });

    if (!record || !record.user.isActive) {
      response.status(401).json({ detail: "Invalid refresh token" });
      return;
    }

    response.json({
      access_token: createAccessToken(record.user.id, record.user.email),
      token_type: "bearer",
      expires_in: ACCESS_TOKEN_EXPIRE_SECONDS
    });
  })
);

authRoutes.get(
  "/me",
  authenticate,
  asyncHandler(async (request, response) => {
    const hasApiKey = Boolean(await getUserApiKey(request.user!.id));
    response.json(toPublicUser(request.user!, hasApiKey));
  })
);

authRoutes.get(
  "/usage",
  authenticate,
  asyncHandler(async (request, response) => {
    const hasApiKey = Boolean(await getUserApiKey(request.user!.id));
    response.json(toPublicUser(request.user!, hasApiKey).usage);
  })
);

authRoutes.get("/debug", (_request, response) => {
  response.json({
    auth_type: "bearer_token",
    is_vercel: process.env.VERCEL === "1"
  });
});
