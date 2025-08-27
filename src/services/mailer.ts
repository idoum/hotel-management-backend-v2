/**
 * @file src/services/mailer.ts
 * @description Adaptateur d'envoi d'emails (Nodemailer) : drivers smtp/console/json.
 */
import nodemailer, { Transporter } from 'nodemailer';

type MailDriver = 'smtp' | 'console' | 'json';

let transporter: Transporter | null = null;

/**
 * Construit le transporter nodemailer selon MAIL_DRIVER.
 */
function buildTransporter(): Transporter {
  const driver = (process.env.MAIL_DRIVER || 'console') as MailDriver;

  if (driver === 'smtp') {
    const host = process.env.SMTP_HOST!;
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
    const user = process.env.SMTP_USER!;
    const pass = process.env.SMTP_PASS!;
    return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
  }

  if (driver === 'json') {
    // Pas d'envoi réel, retourne un JSON du message
    return nodemailer.createTransport({ jsonTransport: true });
  }

  // driver === 'console' (dev): écrit le message sur stdout
  return nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'unix' });
}

/**
 * Retourne le transporter singleton.
 */
function getTransporter(): Transporter {
  if (!transporter) transporter = buildTransporter();
  return transporter!;
}

/**
 * Envoie un email générique.
 * @param to destinataire
 * @param subject sujet
 * @param html contenu HTML
 * @param text contenu texte (fallback)
 */
export async function sendMail({ to, subject, html, text }: { to: string; subject: string; html: string; text?: string; }) {
  const from = process.env.MAIL_FROM || 'no-reply@localhost';
  const t = getTransporter();

  const info = await t.sendMail({ from, to, subject, html, text });

  // En dev: affichage lisible
  const driver = process.env.MAIL_DRIVER || 'console';
  if (driver === 'console') {
    const output = (info as any).message?.toString?.() || '';
    console.log('----- EMAIL (console) -----\n' + output + '\n---------------------------');
  } else if (driver === 'json') {
    console.log('----- EMAIL (json) -----\n', JSON.stringify(info, null, 2), '\n------------------------');
  }

  return info;
}

/**
 * Construit l'URL de reset à partir du token.
 * @param token token opaque
 */
export function buildResetUrl(token: string): string {
  const base = (process.env.APP_WEB_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
  const path = process.env.PASSWORD_RESET_PATH || '/reset-password';
  return `${base}${path}?token=${encodeURIComponent(token)}`;
}
