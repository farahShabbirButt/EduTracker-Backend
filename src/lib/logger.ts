import pino from 'pino';
import { env } from './env.js';

// pino-pretty is a dev dependency, so anything but an explicit development run logs plain JSON
const isDev = env.nodeEnv === 'development';

export const logger = pino({
  level: isDev ? 'debug' : 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
          singleLine: true,
        },
      }
    : undefined,
});
