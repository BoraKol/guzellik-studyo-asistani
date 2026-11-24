export type RepositoryOperation = 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';

export class StudioRepositoryError extends Error {
  readonly operation: RepositoryOperation;
  readonly path: string | null;
  readonly code: string;
  readonly isPermissionError: boolean;
  readonly isQuotaError: boolean;

  constructor(params: {
    message: string;
    operation: RepositoryOperation;
    path: string | null;
    code: string;
    isPermissionError: boolean;
    isQuotaError: boolean;
  }) {
    super(params.message);
    this.name = 'StudioRepositoryError';
    this.operation = params.operation;
    this.path = params.path;
    this.code = params.code;
    this.isPermissionError = params.isPermissionError;
    this.isQuotaError = params.isQuotaError;
  }
}

function extractFirebaseCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String((error as { code?: unknown }).code ?? '');
  }
  return '';
}

/**
 * Converts low-level Firestore/Storage exceptions into typed, PII-free application errors.
 * Detailed diagnostics are logged only in local development mode.
 */
export function wrapRepositoryError(
  error: unknown,
  operation: RepositoryOperation,
  path: string | null
): StudioRepositoryError {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const code = extractFirebaseCode(error);

  const isPermissionError =
    code === 'permission-denied' ||
    code === 'storage/unauthorized' ||
    rawMessage.includes('Missing or insufficient permissions');

  const isQuotaError =
    code === 'resource-exhausted' || rawMessage.includes('Quota exceeded');

  if (import.meta.env.DEV) {
    console.error('[StudioRepository]', { operation, path, code, rawMessage });
  }

  let friendlyMessage =
    'Veriler kaydedilirken bir bağlantı sorunu oluştu. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.';
  if (isPermissionError) {
    friendlyMessage =
      'Oturum yetkiniz doğrulanamadı. E-posta doğrulamanızın tamamlandığından emin olup tekrar giriş yapın.';
  } else if (isQuotaError) {
    friendlyMessage = 'Günlük veri işlem limitine ulaşıldı. Lütfen daha sonra tekrar deneyin.';
  }

  return new StudioRepositoryError({
    message: friendlyMessage,
    operation,
    path,
    code,
    isPermissionError,
    isQuotaError,
  });
}

export function throwRepositoryError(
  error: unknown,
  operation: RepositoryOperation,
  path: string | null
): never {
  throw wrapRepositoryError(error, operation, path);
}
