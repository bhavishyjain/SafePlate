import { getConfig } from "../config/env.js";

export async function sendPasswordResetEmail({ to, name, resetToken }) {
  const config = getConfig();
  if (!config.resendApiKey || !config.resendFrom) {
    throw new Error("RESEND_API_KEY and RESEND_FROM are required for password reset email");
  }
  const resetUrl = `${config.appBaseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.resendApiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: config.resendFrom,
      to: [to],
      subject: "Reset your SafePlate password",
      html: `<p>Hello ${name},</p><p>Use the link below to reset your SafePlate password. It expires in ${config.passwordResetMinutes} minutes.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
    }),
  });
  if (!response.ok) {
    throw new Error(`Resend request failed with status ${response.status}`);
  }
}
