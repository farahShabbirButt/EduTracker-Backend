import { env } from './lib/env.js';
import app from './app.js';
import prisma from './lib/prisma.js';

const PORT = env.port || 5000;

async function startServer() {
  try {
    await prisma.$connect();

    console.info('Database connected');

    app.listen(PORT, () => {
      console.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

startServer();
