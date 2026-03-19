/**
 * Service d'envoi d'emails via Resend
 */

import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is required");
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
}

const FROM_EMAIL = process.env.EMAIL_FROM || "MindSP <noreply@mindsp.fr>";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Envoie un email via Resend
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // En dev sans clé API, log uniquement
    if (!process.env.RESEND_API_KEY) {
      console.log("[DEV] Email simulé:", {
        to: options.to,
        subject: options.subject,
      });
      return true;
    }

    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error("Erreur Resend:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erreur envoi email:", error);
    return false;
  }
}

/**
 * Email de bienvenue après inscription
 */
export async function sendWelcomeEmail(data: {
  to: string;
  firstName: string;
  tenantName: string;
}): Promise<boolean> {
  return sendEmail({
    to: data.to,
    subject: `Bienvenue sur MindSP - ${data.tenantName}`,
    html: `
      <!DOCTYPE html>
      <html><head><meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 24px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #1e40af; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>MindSP</h1></div>
          <div class="content">
            <h2>Bienvenue ${data.firstName} !</h2>
            <p>Votre compte sur <strong>${data.tenantName}</strong> a été créé avec succès.</p>
            <p>Vous pouvez dès maintenant accéder à votre espace :</p>
            <a href="${process.env.NEXTAUTH_URL || "https://mindsp.fr"}" class="button">Accéder à MindSP</a>
            <p>Si vous avez des questions, contactez votre responsable de centre.</p>
          </div>
          <div class="footer"><p>MindSP — Gestion SDIS</p></div>
        </div>
      </body></html>
    `,
  });
}

/**
 * Email de réinitialisation de mot de passe
 */
export async function sendPasswordResetEmail(data: {
  to: string;
  firstName: string;
  resetUrl: string;
}): Promise<boolean> {
  return sendEmail({
    to: data.to,
    subject: "Réinitialisation de votre mot de passe - MindSP",
    html: `
      <!DOCTYPE html>
      <html><head><meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 24px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #1e40af; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 16px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>MindSP</h1></div>
          <div class="content">
            <h2>Réinitialisation du mot de passe</h2>
            <p>Bonjour ${data.firstName},</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
            <a href="${data.resetUrl}" class="button">Réinitialiser mon mot de passe</a>
            <div class="alert">
              <strong>Ce lien expire dans 1 heure.</strong> Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
            </div>
          </div>
          <div class="footer"><p>MindSP — Gestion SDIS</p></div>
        </div>
      </body></html>
    `,
  });
}

/**
 * Template email de confirmation d'inscription FMPA
 */
export function getRegistrationEmailTemplate(data: {
  userName: string;
  fmpaTitle: string;
  fmpaType: string;
  startDate: Date;
  location: string;
  requiresApproval: boolean;
}): string {
  return `
    <!DOCTYPE html>
    <html><head><meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 24px; background: #f9fafb; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>MindSP</h1></div>
        <div class="content">
          <h2>Inscription confirmée</h2>
          <p>Bonjour ${data.userName},</p>
          <p>Votre inscription à la FMPA suivante a bien été enregistrée :</p>
          <ul>
            <li><strong>Titre :</strong> ${data.fmpaTitle}</li>
            <li><strong>Type :</strong> ${data.fmpaType}</li>
            <li><strong>Date :</strong> ${data.startDate.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</li>
            <li><strong>Heure :</strong> ${data.startDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</li>
            <li><strong>Lieu :</strong> ${data.location}</li>
          </ul>
          ${data.requiresApproval ? "<p><em>Votre inscription est en attente d'approbation.</em></p>" : "<p>Votre inscription est confirmée.</p>"}
        </div>
        <div class="footer"><p>MindSP — Gestion SDIS</p></div>
      </div>
    </body></html>
  `;
}

/**
 * Template email de rappel FMPA
 */
export function getReminderEmailTemplate(data: {
  userName: string;
  fmpaTitle: string;
  startDate: Date;
  location: string;
}): string {
  return `
    <!DOCTYPE html>
    <html><head><meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ea580c; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 24px; background: #f9fafb; }
        .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 16px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>MindSP - Rappel</h1></div>
        <div class="content">
          <h2>Rappel : FMPA demain</h2>
          <p>Bonjour ${data.userName},</p>
          <div class="alert">
            <strong>Rappel :</strong> Vous êtes inscrit(e) à la FMPA suivante qui aura lieu <strong>demain</strong> :
          </div>
          <ul>
            <li><strong>Titre :</strong> ${data.fmpaTitle}</li>
            <li><strong>Date :</strong> ${data.startDate.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</li>
            <li><strong>Heure :</strong> ${data.startDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</li>
            <li><strong>Lieu :</strong> ${data.location}</li>
          </ul>
          <p>N'oubliez pas de vous présenter à l'heure avec l'équipement requis.</p>
        </div>
        <div class="footer"><p>MindSP — Gestion SDIS</p></div>
      </div>
    </body></html>
  `;
}
