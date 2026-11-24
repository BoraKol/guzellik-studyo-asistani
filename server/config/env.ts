import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_GEMINI_MODEL = 'gemini-4-hydrogen';

let envLoaded = false;

/**
 * Loads `.env.local` first (matching Vite precedence) and falls back to `.env`.
 * Skips filesystem reads on Vercel where environment variables are injected natively.
 */
export function loadServerEnv(): void {
  if (envLoaded) return;
  envLoaded = true;

  if (process.env.VERCEL) return;

  const cwd = process.cwd();
  const candidates = ['.env.local', '.env'];
  for (const filename of candidates) {
    const filePath = path.resolve(cwd, filename);
    if (fs.existsSync(filePath)) {
      dotenv.config({ path: filePath, override: false });
    }
  }
}

export interface ServerConfig {
  port: number;
  geminiApiKey: string | null;
  geminiModel: string;
  isProduction: boolean;
}

export function getServerConfig(): ServerConfig {
  loadServerEnv();

  const rawKey = process.env.GEMINI_API_KEY?.trim() ?? '';
  const geminiApiKey =
    rawKey && rawKey !== 'MY_GEMINI_API_KEY' && rawKey !== 'YOUR_GEMINI_API_KEY'
      ? rawKey
      : null;

  const parsedPort = Number(process.env.PORT);
  const port = Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort <= 65535
    ? parsedPort
    : 3000;

  return {
    port,
    geminiApiKey,
    geminiModel: process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
    isProduction: process.env.NODE_ENV === 'production',
  };
}
