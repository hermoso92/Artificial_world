/**
 * Simple validation helpers for request body.
 */
import { ApiError } from './errorHandler.js';

export function requireBody(req, res, next) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    throw new ApiError('VALIDATION_ERROR', 'Request body must be JSON object', 400);
  }
  next();
}

export function validateBlueprint(req, res, next) {
  const { name, traits } = req.body ?? {};
  if (name != null && typeof name !== 'string') {
    throw new ApiError('VALIDATION_ERROR', 'name must be a string', 422, [{ field: 'name', message: 'Invalid type' }]);
  }
  if (traits != null && (typeof traits !== 'object' || Array.isArray(traits))) {
    throw new ApiError('VALIDATION_ERROR', 'traits must be an object', 422, [{ field: 'traits', message: 'Invalid type' }]);
  }
  next();
}
