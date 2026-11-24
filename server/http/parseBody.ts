/**
 * Typed HTTP error carrying a safe, client-facing Turkish error message.
 * Prevents leaking raw SDK or runtime error traces to external callers.
 */
export class HttpError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

export function parseRequestBody(body: unknown): Record<string, unknown> {
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  return typeof body === 'object' && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {};
}

// Strips ASCII control characters (except newline/tab) to harden prompts & logs
const CONTROL_CHARS_RX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

export function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(CONTROL_CHARS_RX, '').trim().slice(0, maxLength);
}

export function sanitizeStringList(
  value: unknown,
  maxItems: number,
  maxItemLength = 120
): string[] {
  if (!Array.isArray(value)) return [];
  const results: string[] = [];
  for (const item of value) {
    if (results.length >= maxItems) break;
    const clean = sanitizeText(item, maxItemLength);
    if (clean) results.push(clean);
  }
  return results;
}

export function toPublicErrorResponse(
  error: unknown,
  fallbackMessage: string
): { statusCode: number; body: { error: string } } {
  if (error instanceof HttpError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message },
    };
  }
  return {
    statusCode: 500,
    body: { error: fallbackMessage },
  };
}
