import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';
import { logger } from '../lib/logger.js';

// One line per request with a request id. The serializers list what's logged: the defaults
// would include headers, and so the auth cookie.
export const requestLogger = pinoHttp({
  logger,
  genReqId: (_req, res) => {
    const id = randomUUID();
    res.setHeader('X-Request-Id', id);
    return id;
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    return res.statusCode >= 400 ? 'warn' : 'info';
  },
  autoLogging: { ignore: (req) => req.url === '/health' },
  // The visitor's address as Express sees it after TRUST_PROXY, which the login limit counts by
  customProps: (req) => ({ ip: (req as unknown as { ip?: string }).ip }),
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});
