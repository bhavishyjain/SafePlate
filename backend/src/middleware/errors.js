export class AppError extends Error {
  constructor(statusCode, message, code = "REQUEST_FAILED", details) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function notFoundHandler(req, res) {
  return res.status(404).json({
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} was not found`,
      requestId: req.requestId,
    },
  });
}

export function errorHandler(error, req, res, _next) {
  const isMalformedJson = error instanceof SyntaxError && error.status === 400 && "body" in error;
  const isValidationError = error?.name === "ValidationError";
  const isDuplicateKey = error?.code === 11000;
  const isCorsError = error?.message === "Origin is not allowed by CORS";
  const isKnownError = error instanceof AppError;
  const statusCode = isKnownError
    ? error.statusCode
    : isMalformedJson || isValidationError
      ? 400
      : isDuplicateKey
        ? 409
        : isCorsError
          ? 403
          : 500;
  const errorCode = isKnownError
    ? error.code
    : isMalformedJson
      ? "INVALID_JSON"
      : isValidationError
        ? "VALIDATION_ERROR"
        : isDuplicateKey
          ? "DUPLICATE_RESOURCE"
          : isCorsError
            ? "CORS_FORBIDDEN"
            : "INTERNAL_SERVER_ERROR";
  const message = isKnownError
    ? error.message
    : isMalformedJson
      ? "Request body contains invalid JSON"
      : isValidationError
        ? "Database validation failed"
        : isDuplicateKey
          ? "A resource with these unique values already exists"
          : isCorsError
            ? "Request origin is not allowed"
            : "An unexpected error occurred";
  const response = {
    error: {
      code: errorCode,
      message,
      requestId: req.requestId,
    },
  };

  if (isKnownError && error.details) {
    response.error.details = error.details;
  }
  if (statusCode === 500 && process.env.NODE_ENV !== "test") {
    console.error(`[${req.requestId}]`, error);
  }

  return res.status(statusCode).json(response);
}
