type RuntimeWarning = {
  message: string;
};

const PLACEHOLDER_VALUES = new Set([
  "replace-with-a-long-random-secret",
  "replace-with-a-different-long-random-secret",
  "change-me",
  "changeme",
  "secret",
  "password"
]);

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function getApiPort() {
  return parseIntegerEnv("API_PORT", 4000, { min: 1, max: 65535 });
}

export function getJsonBodyLimit() {
  return process.env.JSON_BODY_LIMIT?.trim() || "1mb";
}

export function getTrustProxy() {
  const value = process.env.TRUST_PROXY?.trim().toLowerCase();
  if (!value || value === "false" || value === "0") {
    return false;
  }
  if (value === "true") {
    return 1;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : false;
}

export function getAllowedOrigins() {
  const configured = splitList(process.env.CORS_ORIGINS);
  const webOrigin = process.env.WEB_ORIGIN?.trim();
  if (webOrigin) {
    configured.unshift(webOrigin);
  }

  const origins = configured.length > 0
    ? configured
    : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"];

  return [...new Set(origins.map((origin) => origin.replace(/\/$/, "")))];
}

export function getAdminEmails() {
  return splitList(process.env.ADMIN_EMAILS).map((email) => email.toLowerCase());
}

export function isAdminEmail(email: string) {
  const admins = getAdminEmails();
  return admins.length > 0 && admins.includes(email.toLowerCase());
}

export function getRateLimitConfig(prefix: "GLOBAL" | "AUTH" | "CHAT" | "API_KEY") {
  const defaults = {
    GLOBAL: { windowMs: 60_000, max: 300 },
    AUTH: { windowMs: 15 * 60_000, max: 30 },
    CHAT: { windowMs: 60_000, max: 30 },
    API_KEY: { windowMs: 15 * 60_000, max: 20 }
  }[prefix];

  return {
    windowMs: parseIntegerEnv(`${prefix}_RATE_LIMIT_WINDOW_MS`, defaults.windowMs, { min: 1_000 }),
    max: parseIntegerEnv(`${prefix}_RATE_LIMIT_MAX`, defaults.max, { min: 1 })
  };
}

export function validateServerEnvironment() {
  const errors: string[] = [];
  const warnings: RuntimeWarning[] = [];

  requireEnv("DATABASE_URL", errors);
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl && !databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
    errors.push("DATABASE_URL must be a PostgreSQL connection string.");
  }

  const jwtSecret = requireEnv("JWT_SECRET_KEY", errors);
  const encryptionKey = requireEnv("ENCRYPTION_KEY", errors);

  if (isProduction()) {
    validateProductionSecret("JWT_SECRET_KEY", jwtSecret, errors);
    validateProductionSecret("ENCRYPTION_KEY", encryptionKey, errors);

    if (jwtSecret && encryptionKey && jwtSecret === encryptionKey) {
      errors.push("ENCRYPTION_KEY must be different from JWT_SECRET_KEY in production.");
    }

    if (!process.env.WEB_ORIGIN?.trim()) {
      errors.push("WEB_ORIGIN is required in production.");
    }
  }

  validateUrlList("WEB_ORIGIN", process.env.WEB_ORIGIN, errors);
  validateUrlList("CORS_ORIGINS", process.env.CORS_ORIGINS, errors);

  const provider = process.env.LLM_PROVIDER?.trim();
  if (provider && provider !== "openai" && provider !== "openrouter") {
    errors.push('LLM_PROVIDER must be either "openai" or "openrouter".');
  }

  if (!process.env.OPENROUTER_API_KEY?.trim()) {
    warnings.push({
      message: "OPENROUTER_API_KEY is empty. Free-tier chat will require each user to save an OpenRouter key."
    });
  }

  if (getAdminEmails().length === 0) {
    warnings.push({
      message: "ADMIN_EMAILS is empty. The global /api/settings endpoint will be unavailable to signed-in users."
    });
  }

  if (errors.length > 0) {
    throw new Error(`Invalid server environment:\n- ${errors.join("\n- ")}`);
  }

  return { warnings };
}

function requireEnv(name: string, errors: string[]) {
  const value = process.env[name]?.trim();
  if (!value) {
    errors.push(`${name} is required.`);
    return null;
  }
  return value;
}

function validateProductionSecret(name: string, value: string | null, errors: string[]) {
  if (!value) {
    return;
  }
  if (value.length < 32) {
    errors.push(`${name} must be at least 32 characters in production.`);
  }
  if (PLACEHOLDER_VALUES.has(value.toLowerCase())) {
    errors.push(`${name} must not use a placeholder value in production.`);
  }
}

function validateUrlList(name: string, value: string | undefined, errors: string[]) {
  for (const item of splitList(value)) {
    try {
      const url = new URL(item);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        errors.push(`${name} must contain only http or https origins.`);
      }
    } catch {
      errors.push(`${name} contains an invalid URL: ${item}`);
    }
  }
}

function splitList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseIntegerEnv(name: string, fallback: number, bounds: { min?: number; max?: number } = {}) {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  if (bounds.min !== undefined && parsed < bounds.min) {
    return fallback;
  }
  if (bounds.max !== undefined && parsed > bounds.max) {
    return fallback;
  }

  return parsed;
}
