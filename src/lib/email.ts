import nodemailer, { Transporter } from 'nodemailer';
import { env } from './env.js';

let transporter: Transporter | null = null;

// Lazy singleton — transporter is built on first use so the server can boot
// even when SMTP is not configured (e.g. local dev without email needs).
function getTransporter(): Transporter {
  if (transporter) return transporter;

  const { host, port, user, pass } = env.smtp;
  if (!host || !port || !user || !pass) {
    throw new Error(
      'SMTP not configured — set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env before sending email',
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    auth: { user, pass },
  });
  return transporter;
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

async function send({ to, subject, html }: SendArgs): Promise<void> {
  const from = env.smtp.from;
  if (!from) {
    throw new Error('SMTP_FROM must be set in .env to send email');
  }
  await getTransporter().sendMail({ from, to, subject, html });
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
