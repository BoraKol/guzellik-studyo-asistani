import { GoogleGenAI } from '@google/genai';
import { getServerConfig } from '../config/env.js';
import { HttpError } from '../http/parseBody.js';

let cachedKey: string | null = null;
let cachedClient: GoogleGenAI | null = null;

/**
 * Returns a cached server-side GoogleGenAI client.
 * Never embeds external platform headers or exposes GEMINI_API_KEY to browser bundles.
 */
export function getGeminiClient(): { client: GoogleGenAI; model: string } {
  const { geminiApiKey, geminiModel } = getServerConfig();

  if (!geminiApiKey) {
    throw new HttpError(
      503,
      'GEMINI_API_KEY tanımlı değil. Manuel kayıt ve standart WhatsApp şablonları sorunsuz çalışmaya devam eder.'
    );
  }

  if (!cachedClient || cachedKey !== geminiApiKey) {
    cachedClient = new GoogleGenAI({ apiKey: geminiApiKey });
    cachedKey = geminiApiKey;
  }

  return { client: cachedClient, model: geminiModel };
}
