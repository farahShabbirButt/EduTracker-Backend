import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV,
  port: Number(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL as string,
};

if (!env.databaseUrl) {
  throw new Error('DATABASE_URL is not defined');
}
