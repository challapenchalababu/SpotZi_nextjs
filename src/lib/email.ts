import { createTransport } from "nodemailer";
import { APP_NAME, isSmtpConfigured } from "@/lib/env";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!isSmtpConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`Password reset link for ${to}: ${resetUrl}`);
      return { delivered: false as const };
    }
    console.error("Password reset email was not sent because SMTP is not configured.");
    return { delivered: false as const };
  }

  const transport = createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });

  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Reset your ${APP_NAME} password`,
    text: `Use this link to reset your password:\n${resetUrl}\n\nThe link expires in 30 minutes. If you did not ask for a reset, you can ignore this email.`,
  });
  return { delivered: true as const };
}
