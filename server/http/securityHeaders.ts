export interface HeaderWritableResponse {
  setHeader: (name: string, value: string) => void;
}

const BASE_SECURITY_HEADERS: ReadonlyArray<readonly [string, string]> = [
  ['X-Content-Type-Options', 'nosniff'],
  ['X-Frame-Options', 'DENY'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ['Permissions-Policy', 'camera=(), microphone=(), geolocation=()'],
];

export function applySecurityHeaders(
  res: HeaderWritableResponse,
  options: { noStore?: boolean } = {}
): void {
  for (const [header, value] of BASE_SECURITY_HEADERS) {
    res.setHeader(header, value);
  }
  if (options.noStore) {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
  }
}
