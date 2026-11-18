import nodemailer, { Transporter } from 'nodemailer';
import { env } from './env.js';

let transporter: Transporter | null = null;

// SMTP, for development (e.g. Mailtrap). Production sends through Brevo's API instead.
// Lazy singleton — transporter is built on first use so the server can boot
// even when SMTP is not configured (e.g. local dev without email needs).
function getTransporter(): Transporter {
  if (transporter) return transporter;

  const { host, port, user, pass } = env.smtp;
  if (!host || !port || !user || !pass) {
    throw new Error(
      'Email not configured — set BREVO_API_KEY, or SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, in .env before sending email',
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    auth: { user, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  return transporter;
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

// "EduTracker <admin@school.pk>" or just "admin@school.pk"
const parseFrom = (from: string) => {
  const match = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(from);
  return match ? { name: match[1].replace(/^"|"$/g, '') || undefined, email: match[2] } : { email: from.trim() };
};

// Brevo's web API, over HTTPS. Used in production because Render's free plan blocks the SMTP
// ports (25, 465 and 587).
async function sendWithBrevo(apiKey: string, from: string, { to, subject, html }: SendArgs): Promise<void> {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ sender: parseFrom(from), to: [{ email: to }], subject, htmlContent: html }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    // Brevo's error body says what's wrong (e.g. an unverified sender) and holds no secrets
    const detail = await response.text().catch(() => '');
    throw new Error(`Brevo refused the email: ${response.status} ${detail.slice(0, 300)}`);
  }
}

async function send(args: SendArgs): Promise<void> {
  const from = env.emailFrom;
  if (!from) {
    throw new Error('EMAIL_FROM must be set in .env to send email');
  }
  if (env.brevoApiKey) return sendWithBrevo(env.brevoApiKey, from, args);
  await getTransporter().sendMail({ from, ...args });
}

export const EmailService = {
  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    await send({
      to,
      subject: 'Reset your EduTracker password',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #111;">Reset your password</h2>
          <p style="color: #444; line-height: 1.5;">
            We received a request to reset the password for your EduTracker admin account.
            Click the button below to choose a new password. This link expires in 1 hour
            and can only be used once.
          </p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}"
               style="display: inline-block; background: #2563eb; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500;">
              Reset password
            </a>
          </p>
          <p style="color: #888; font-size: 13px; line-height: 1.5;">
            If you didn't request this, you can safely ignore this email — your password
            will stay the same.
          </p>
          <p style="color: #aaa; font-size: 12px; word-break: break-all;">
            Or paste this URL into your browser:<br/>${resetUrl}
          </p>
        </div>
      `,
    });
  },
};
