import { env } from './lib/env.js';
import app from './app.js';
import { logger } from './lib/logger.js';
import prisma from './lib/prisma.js';

const PORT = env.port || 5000;

async function startServer() {
  try {
    await prisma.$connect();

    logger.info('Database connected');

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

startServer();
