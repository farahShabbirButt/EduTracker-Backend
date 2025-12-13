import { env } from './config/env.js';
import app from './app.js';
import prisma from './lib/prisma.js';

const PORT = env.port || 5000;

app.listen(PORT, () => {
  console.info(`Server running on port ${PORT}`);
});

prisma
  .$connect()
  .then(() => console.info('Database connected'))
  .catch(console.error);
