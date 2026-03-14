/**
 * @module error-response
 *
 * Provides standardized API error response helpers for all route handlers.
 *
 * Key responsibilities:
 * - Enforce a consistent error response schema across all endpoints.
 * - Map common failure modes to correct HTTP status codes.
 * - Prevent internal details (stack traces, SQL) from leaking to clients.
 */

import { NextResponse } from 'next/server'

/** Machine-readable error codes used in API responses. */
type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_FAILED'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'

/** Shape of every error response returned by the API. */
interface ApiErrorBody {
  status: number
  error_code: ApiErrorCode
  message: string
  details?: unknown
}

/**
 * Build a standardized JSON error response.
 *
 * @param status  - HTTP status code (e.g. 400, 401, 500).
 * @param errorCode - Machine-readable error code.
 * @param message - Human-readable description of the error.
 * @param details - Optional additional context (field-level validation errors, etc.).
 * @returns A NextResponse containing the structured error body.
 */
function buildErrorResponse(
  status: number,
  errorCode: ApiErrorCode,
  message: string,
  details?: unknown
): NextResponse<ApiErrorBody> {
  const body: ApiErrorBody = { status, error_code: errorCode, message }
  if (details !== undefined) {
    body.details = details
  }
  return NextResponse.json(body, { status })
}

/**
 * Return a 401 Unauthorized response.
 *
 * @param message - Optional custom message; defaults to "Authentication required".
 * @returns NextResponse with status 401.
 */
export function unauthorizedResponse(message = 'Authentication required'): NextResponse<ApiErrorBody> {
  return buildErrorResponse(401, 'UNAUTHORIZED', message)
}

/**
 * Return a 403 Forbidden response.
 *
 * @param message - Optional custom message; defaults to "Insufficient permissions".
 * @returns NextResponse with status 403.
 */
export function forbiddenResponse(message = 'Insufficient permissions'): NextResponse<ApiErrorBody> {
  return buildErrorResponse(403, 'FORBIDDEN', message)
}

/**
 * Return a 404 Not Found response.
 *
 * @param resource - The type of resource that was not found (e.g. "Podcast").
 * @returns NextResponse with status 404.
 */
export function notFoundResponse(resource: string): NextResponse<ApiErrorBody> {
  return buildErrorResponse(404, 'NOT_FOUND', `${resource} not found`)
}

/**
 * Return a 400 Validation Failed response.
 *
 * @param message - Description of what validation failed.
 * @param details - Optional field-level error details.
 * @returns NextResponse with status 400.
 */
export function validationErrorResponse(message: string, details?: unknown): NextResponse<ApiErrorBody> {
  return buildErrorResponse(400, 'VALIDATION_FAILED', message, details)
}

/**
 * Return a 500 Internal Server Error response.
 *
 * Logs the original error server-side but returns a safe message to the client.
 *
 * @param operation - Human-readable label for the failed operation (e.g. "fetch podcasts").
 * @param originalError - The underlying error object (logged, never sent to client).
 * @returns NextResponse with status 500.
 */
export function internalErrorResponse(operation: string, originalError?: unknown): NextResponse<ApiErrorBody> {
  if (originalError) {
    console.error(`[API] Failed to ${operation}:`, originalError)
  }
  return buildErrorResponse(500, 'INTERNAL_ERROR', `Failed to ${operation}`)
}
