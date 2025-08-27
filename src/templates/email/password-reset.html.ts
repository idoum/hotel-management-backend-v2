/**
 * @file src/templates/email/password-reset.html.ts
 * @description Template HTML/texte pour l'email de réinitialisation de mot de passe.
 */

/**
 * Génère le HTML de l'email de reset.
 */
export function renderPasswordResetHtml(params: { resetUrl: string; minutes: number }) {
  const { resetUrl, minutes } = params;
  return `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; max-width: 560px; margin: 0 auto;">
    <h2>Réinitialiser votre mot de passe</h2>
    <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
    <p>Ce lien expire dans <strong>${minutes} minutes</strong>.</p>
    <p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#0d6efd;color:#fff;text-decoration:none;border-radius:6px;">
        Réinitialiser mon mot de passe
      </a>
    </p>
    <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    <hr />
    <p style="color:#666;font-size:12px;">Hotel Management – sécurité du compte</p>
  </div>`;
}

/**
 * Génère la version texte (fallback) de l'email.
 */
export function renderPasswordResetText(params: { resetUrl: string; minutes: number }) {
  const { resetUrl, minutes } = params;
  return [
    'Réinitialiser votre mot de passe',
    '',
    `Ce lien expire dans ${minutes} minutes.`,
    '',
    `Lien: ${resetUrl}`,
    '',
    "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email."
  ].join('\n');
}
