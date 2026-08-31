import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV,
  port: Number(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL as string,

  // Public URL of the frontend — used to build links in transactional emails.
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',

  // Seed-only — optional at app boot, validated at seed-time in prisma/seed.ts.
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  seedDevData: process.env.SEED_DEV_DATA === 'true',

  // SMTP — optional at app boot, validated at send-time in EmailService.
  // Any provider that speaks SMTP works (Mailtrap dev / Resend / SendGrid / Gmail).
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
  },

  // Auth — JWT signing + cookie name. Required for the auth module to work.
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '24h',
  authCookieName: process.env.AUTH_COOKIE_NAME ?? 'et_auth',
};

if (!env.databaseUrl) {
  throw new Error('DATABASE_URL is not defined');
}

if (!env.jwtSecret) {
  throw new Error('JWT_SECRET is not defined');
}
