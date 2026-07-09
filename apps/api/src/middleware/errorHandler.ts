import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      error: "ValidationError",
      details: error.flatten()
    });
    return;
  }

  const message = error instanceof Error ? error.message : "Unexpected server error";
  const status = message.includes("not found") || message.includes("was not found") ? 404 : 500;
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    console.error(error);
  }

  response.status(status).json({
    error: status === 404 ? "NotFound" : "ServerError",
    message: isProduction && status === 500 ? "Unexpected server error" : message
  });
};
