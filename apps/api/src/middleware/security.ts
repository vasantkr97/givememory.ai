import cors from "cors";
import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";
import { getAllowedOrigins, isProduction } from "../config/env";

export function requestId(): RequestHandler {
  return (request, response, next) => {
    const existing = request.header("x-request-id");
    const id = existing && existing.length <= 100 ? existing : randomUUID();
    response.setHeader("X-Request-Id", id);
    next();
  };
}

export function securityHeaders(): RequestHandler {
  return (_request, response, next) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    response.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");

    if (isProduction()) {
      response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }

    next();
  };
}

export function noStore(): RequestHandler {
  return (_request, response, next) => {
    response.setHeader("Cache-Control", "no-store");
    next();
  };
}

export function corsMiddleware() {
  const allowedOrigins = getAllowedOrigins();

  return cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      callback(null, allowedOrigins.includes(origin.replace(/\/$/, "")) ? origin : false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "X-Request-Id"],
    maxAge: 86_400,
    credentials: false
  });
}
