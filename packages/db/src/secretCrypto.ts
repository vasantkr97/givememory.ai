import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ENCRYPTED_SECRET_PREFIX = "enc:v1";

function encryptionKey() {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("ENCRYPTION_KEY environment variable is required");
  }

  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    ENCRYPTED_SECRET_PREFIX,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url")
  ].join(".");
}

export function decryptSecret(payload: string) {
  const parts = payload.split(".");
  const encryptedParts = payload.startsWith(`${ENCRYPTED_SECRET_PREFIX}.`)
    ? parts.slice(1)
    : parts;
  const [ivText, tagText, encryptedText] = encryptedParts;

  if (!ivText || !tagText || !encryptedText || encryptedParts.length !== 3) {
    throw new Error("Invalid encrypted secret");
  }

  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, "base64url")),
    decipher.final()
  ]).toString("utf8");
}

export function decryptStoredSecret(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value.startsWith(`${ENCRYPTED_SECRET_PREFIX}.`) ? decryptSecret(value) : value;
}
