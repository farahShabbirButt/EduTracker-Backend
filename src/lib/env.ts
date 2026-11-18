import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

export const env = {
  nodeEnv: process.env.NODE_ENV,
  port: Number(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL as string,

  // Public URL of the frontend — used to build links in transactional emails.
  // No trailing slash, so links like `${frontendUrl}/reset-password` have a single one.
  frontendUrl: (process.env.FRONTEND_URL ?? 'http://localhost:5173').replace(/\/+$/, ''),

  // Seed-only — optional at app boot, validated at seed-time in prisma/seed.ts.
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  seedDevData: process.env.SEED_DEV_DATA === 'true',

  // Email — optional at app boot, validated at send-time in lib/email.ts. With BREVO_API_KEY
  // email goes through Brevo's web API (production: Render's free plan blocks SMTP ports);
  // otherwise through SMTP (development, e.g. Mailtrap).
  brevoApiKey: process.env.BREVO_API_KEY,
  // The sender, e.g. "EduTracker <admin@school.pk>". SMTP_FROM is the older name.
  emailFrom: process.env.EMAIL_FROM ?? process.env.SMTP_FROM,
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  // Auth — JWT signing + cookie name. Required for the auth module to work.
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '24h',
  authCookieName: process.env.AUTH_COOKIE_NAME ?? 'et_auth',

  // How many proxies stand in front of the server, so req.ip is the visitor's own address
  // (the login limit counts per address). Render has one. 0 locally: nothing is in front, and
  // trusting a proxy that isn't there would let anyone pick their address.
  trustProxy: Number(process.env.TRUST_PROXY ?? (process.env.NODE_ENV === 'production' ? 1 : 0)),

  // The built frontend (the EduTracker repo's dist folder). When set, this server serves the
  // app too, so the app and the API share one address. Unset in development, where Vite serves it.
  webDist: process.env.WEB_DIST ? path.resolve(process.env.WEB_DIST) : undefined,
};

if (!env.databaseUrl) {
  throw new Error('DATABASE_URL is not defined — copy .env.example to .env and set your PostgreSQL connection string.');
}

if (!env.jwtSecret) {
  throw new Error(
    'JWT_SECRET is not defined — generate one with `openssl rand -hex 64` and add it to .env. Rotating it logs everyone out.',
  );
}

if (env.webDist && !fs.existsSync(path.join(env.webDist, 'index.html'))) {
  throw new Error(`WEB_DIST is set to ${env.webDist}, but there is no index.html there. Build the frontend first.`);
}

// On the live server a missing setting stops the start, with every problem named at once,
// rather than surfacing later as a failed reset email or a weak login secret.
if (env.nodeEnv === 'production') {
  const problems = [
    env.jwtSecret.length < 32 && 'JWT_SECRET must be at least 32 characters (use `openssl rand -hex 64`)',
    !process.env.FRONTEND_URL && 'FRONTEND_URL must be the address people open, e.g. https://<name>.onrender.com',
    process.env.FRONTEND_URL &&
      !process.env.FRONTEND_URL.startsWith('https://') &&
      'FRONTEND_URL must start with https://',
    !env.emailFrom && 'EMAIL_FROM must be set, e.g. EduTracker <admin@school.pk>',
    !env.brevoApiKey && !env.smtp.host && 'BREVO_API_KEY must be set so password-reset emails can be sent',
  ].filter(Boolean);
  if (problems.length > 0) {
    throw new Error(`Missing or wrong production settings:\n- ${problems.join('\n- ')}`);
  }
}
