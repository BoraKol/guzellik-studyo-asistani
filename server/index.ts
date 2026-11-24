import express, { type NextFunction, type Request, type Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSessionNote } from './ai/sessionParser.js';
import { polishWhatsAppMessage } from './ai/whatsappPolisher.js';
import { getServerConfig } from './config/env.js';
import { parseRequestBody, toPublicErrorResponse } from './http/parseBody.js';
import { createRateLimiter } from './http/rateLimiter.js';
import { applySecurityHeaders } from './http/securityHeaders.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress ?? 'local';
}

export async function startServer(): Promise<void> {
  const config = getServerConfig();
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));

  app.use((req: Request, res: Response, next: NextFunction) => {
    applySecurityHeaders(res, { noStore: req.path.startsWith('/api/') });
    next();
  });

  const aiRateLimit = createRateLimiter({ windowMs: 60_000, maxRequests: 25 });

  app.use('/api/ai', (req: Request, res: Response, next: NextFunction) => {
    const verdict = aiRateLimit(getClientIp(req));
    if (!verdict.allowed) {
      res.setHeader('Retry-After', String(verdict.retryAfterSeconds));
      res.status(429).json({
        error: 'Çok fazla AI isteği gönderildi. Lütfen kısa süre bekleyip tekrar deneyin.',
      });
      return;
    }
    next();
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      aiConfigured: Boolean(config.geminiApiKey),
    });
  });

  app.post('/api/ai/parse-session', async (req: Request, res: Response) => {
    try {
      const result = await parseSessionNote(parseRequestBody(req.body));
      res.json(result);
    } catch (error) {
      const { statusCode, body } = toPublicErrorResponse(
        error,
        'AI ayrıştırma sırasında beklenmedik bir hata oluştu.'
      );
      res.status(statusCode).json(body);
    }
  });

  app.post('/api/ai/polish-whatsapp', async (req: Request, res: Response) => {
    try {
      const result = await polishWhatsAppMessage(parseRequestBody(req.body));
      res.json(result);
    } catch (error) {
      const { statusCode, body } = toPublicErrorResponse(
        error,
        'AI mesaj taslağı oluşturulurken bir hata oluştu.'
      );
      res.status(statusCode).json(body);
    }
  });

  if (config.isProduction) {
    const distDir = path.resolve(ROOT_DIR, 'dist');
    app.use(express.static(distDir, { maxAge: '7d', index: false }));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`StüdyoAsistan server listening on http://localhost:${config.port}`);
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}
