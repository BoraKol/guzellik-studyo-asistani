import { getServerConfig } from '../server/config/env';
import { applySecurityHeaders } from '../server/http/securityHeaders';

interface ServerlessRequest {
  method?: string;
}

interface ServerlessResponse {
  status: (code: number) => ServerlessResponse;
  json: (payload: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

export default function handler(req: ServerlessRequest, res: ServerlessResponse) {
  applySecurityHeaders(res, { noStore: true });

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    res.status(405).json({ error: 'Yalnızca GET istekleri desteklenir.' });
    return;
  }

  const config = getServerConfig();
  res.status(200).json({
    status: 'ok',
    aiConfigured: Boolean(config.geminiApiKey),
  });
}
