import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const ACCESS_TOKEN_EXPIRE_SECONDS = 60 * 60;
const REFRESH_TOKEN_EXPIRE_SECONDS = 60 * 60 * 24 * 7;

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function jwtSecret() {
  const secret = process.env.JWT_SECRET_KEY;
  if (!secret) {
    throw new Error("JWT_SECRET_KEY environment variable is required");
  }
  return secret;
}

function signJwt(payload: Record<string, unknown>) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", jwtSecret()).update(`${encodedHeader}.${encodedPayload}`).digest("base64url");
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function createAccessToken(userId: number, email: string) {
  const now = Math.floor(Date.now() / 1000);
  return signJwt({
    sub: String(userId),
    email,
    type: "access",
    iat: now,
    exp: now + ACCESS_TOKEN_EXPIRE_SECONDS
  });
}

export function createRefreshToken(userId: number) {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = new Date((now + REFRESH_TOKEN_EXPIRE_SECONDS) * 1000);
  const token = signJwt({
    sub: String(userId),
    type: "refresh",
    iat: now,
    exp: Math.floor(expiresAt.getTime() / 1000)
  });
  return { token, expiresAt };
}

export function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split(".");
    if (!encodedHeader || !encodedPayload || !signature) {
      return null;
    }

    const expected = createHmac("sha256", jwtSecret()).update(`${encodedHeader}.${encodedPayload}`).digest("base64url");
    if (Buffer.byteLength(signature) !== Buffer.byteLength(expected)) {
      return null;
    }
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Record<string, unknown>;
    const exp = typeof payload.exp === "number" ? payload.exp : 0;
    if (exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 64).toString("base64url");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [, salt, hash] = storedHash.split(":");
  if (!salt || !hash) {
    return false;
  }
  const attempted = scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, "base64url");
  return stored.byteLength === attempted.byteLength && timingSafeEqual(stored, attempted);
}

function encryptionKey() {
  const secret = process.env.ENCRYPTION_KEY ?? process.env.JWT_SECRET_KEY;
  if (!secret) {
    throw new Error("ENCRYPTION_KEY or JWT_SECRET_KEY environment variable is required");
  }
  return createHash("sha256").update(secret).digest();
}

export function encryptApiKey(apiKey: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptApiKey(payload: string) {
  const [ivText, tagText, encryptedText] = payload.split(".");
  if (!ivText || !tagText || !encryptedText) {
    throw new Error("Invalid encrypted API key");
  }
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, "base64url")),
    decipher.final()
  ]).toString("utf8");
}
