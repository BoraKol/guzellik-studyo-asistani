import { polishWhatsAppMessage } from '../../server/ai/whatsappPolisher.js';
import {
  parseRequestBody,
  toPublicErrorResponse,
} from '../../server/http/parseBody.js';
import { applySecurityHeaders } from '../../server/http/securityHeaders.js';

interface ServerlessRequest {
  method?: string;
  body?: unknown;
}

interface ServerlessResponse {
  status: (code: number) => ServerlessResponse;
  json: (payload: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

export default async function handler(req: ServerlessRequest, res: ServerlessResponse) {
  applySecurityHeaders(res, { noStore: true });

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Yalnızca POST istekleri desteklenir.' });
    return;
  }

  try {
    const result = await polishWhatsAppMessage(parseRequestBody(req.body));
    res.status(200).json(result);
  } catch (error) {
    const { statusCode, body } = toPublicErrorResponse(
      error,
      'AI mesaj taslağı oluşturulurken bir hata oluştu.'
    );
    res.status(statusCode).json(body);
  }
}
