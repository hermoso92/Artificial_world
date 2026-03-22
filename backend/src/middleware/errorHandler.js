/**
 * Centralized API error handling.
 * Standardized error responses per api-error-handling skill.
 */
import logger from '../utils/logger.js';

export class ApiError extends Error {
  constructor(code, message, statusCode = 500, details = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

const ERROR_CODES = {
  BAD_REQUEST: { status: 400 },
  VALIDATION_ERROR: { status: 422 },
  NOT_FOUND: { status: 404 },
  INTERNAL_ERROR: { status: 500 },
};

export function formatErrorResponse(err, requestId = null) {
  const statusCode = err.statusCode ?? ERROR_CODES[err.code]?.status ?? 500;
  return {
    success: false,
    error: {
      code: err.code ?? 'INTERNAL_ERROR',
      message: err.message ?? 'Internal server error',
      statusCode,
      requestId: requestId ?? `req_${Date.now()}`,
      timestamp: err.timestamp ?? new Date().toISOString(),
      ...(err.details && { details: err.details }),
    },
  };
}

export function errorHandler(err, req, res, next) {
  const requestId = req.headers['x-request-id'] ?? `req_${Date.now()}`;
  const response = formatErrorResponse(err, requestId);

  if (response.error.statusCode >= 500) {
    logger.error(`[${requestId}] ${err.message}`, err.stack);
  } else {
    logger.warn(`[${requestId}] ${err.message}`);
  }

  res.status(response.error.statusCode).json(response);
}
