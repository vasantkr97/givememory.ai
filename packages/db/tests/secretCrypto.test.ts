import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { decryptSecret, decryptStoredSecret, encryptSecret } from "../src/secretCrypto";

describe("secret encryption", () => {
  const originalKey = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = "test-encryption-key-that-is-long-enough";
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.ENCRYPTION_KEY;
    } else {
      process.env.ENCRYPTION_KEY = originalKey;
    }
  });

  test("round-trips a secret using authenticated encryption", () => {
    const encrypted = encryptSecret("sk-private-value");

    expect(encrypted).toStartWith("enc:v1.");
    expect(encrypted).not.toContain("sk-private-value");
    expect(decryptSecret(encrypted)).toBe("sk-private-value");
  });

  test("continues to read legacy unprefixed encrypted values", () => {
    const encrypted = encryptSecret("legacy-secret");
    const legacyPayload = encrypted.split(".").slice(1).join(".");

    expect(decryptSecret(legacyPayload)).toBe("legacy-secret");
  });

  test("leaves legacy plaintext provider settings readable until the next save", () => {
    expect(decryptStoredSecret("legacy-plaintext-key")).toBe("legacy-plaintext-key");
  });
});
