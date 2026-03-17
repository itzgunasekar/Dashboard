import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const FROM = process.env.EMAIL_FROM || 'AETHER <noreply@aether.trading>';

export async function sendVerificationEmail(email: string, token: string) {
  const link = `${APP_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Verify Your AETHER Account',
    html: emailTemplate('Verify Your Email', `
      <p>Welcome to AETHER Trading Platform. Click below to verify your email address.</p>
      <a href="${link}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Verify Email</a>
      <p style="margin-top:16px;font-size:12px;color:#64748b;">This link expires in 24 hours.</p>
    `),
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const link = `${APP_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Reset Your AETHER Password',
    html: emailTemplate('Reset Password', `
      <p>You requested a password reset. Click below to set a new password.</p>
      <a href="${link}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Reset Password</a>
      <p style="margin-top:16px;font-size:12px;color:#64748b;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    `),
  });
}

export async function sendBotNotification(email: string, subject: string, message: string) {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `AETHER: ${subject}`,
    html: emailTemplate(subject, `<p>${message}</p>`),
  });
}

function emailTemplate(title: string, body: string): string {
  return `
  <!DOCTYPE html>
  <html><head><meta charset="utf-8"/></head>
  <body style="margin:0;padding:0;background:#020408;font-family:system-ui,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
      <div style="text-align:center;margin-bottom:32px;">
        <span style="font-size:28px;font-weight:900;background:linear-gradient(135deg,#00d4ff,#00ffb2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">AETHER</span>
      </div>
      <div style="background:rgba(14,31,58,0.8);border:1px solid rgba(0,212,255,0.15);border-radius:16px;padding:32px;">
        <h2 style="color:#e2e8f0;margin:0 0 16px;font-size:20px;">${title}</h2>
        <div style="color:#94a3b8;line-height:1.6;">${body}</div>
      </div>
      <p style="text-align:center;margin-top:24px;font-size:11px;color:#475569;">
        AETHER Trading Platform &copy; ${new Date().getFullYear()}
      </p>
    </div>
  </body></html>`;
}
