# 📧 Configuration des Notifications Email

## Vue d'ensemble

Le système de notifications email est prêt à être configuré. Les templates HTML sont créés et le code est en place.

## Services d'Email Recommandés

### 1. **Resend** (Recommandé) ⭐

- **Avantages** : Simple, moderne, excellent pour Next.js
- **Prix** : 100 emails/jour gratuits, puis $20/mois
- **Setup** :
  ```bash
  npm install resend
  ```
  ```typescript
  // Dans src/lib/email.ts
  import { Resend } from "resend";
  const resend = new Resend(process.env.RESEND_API_KEY);
  ```

### 2. **SendGrid**

- **Avantages** : Fiable, beaucoup de fonctionnalités
- **Prix** : 100 emails/jour gratuits
- **Setup** :
  ```bash
  npm install @sendgrid/mail
  ```

### 3. **AWS SES**

- **Avantages** : Très économique, scalable
- **Prix** : $0.10 pour 1000 emails
- **Setup** : Nécessite configuration AWS

## Configuration Rapide avec Resend

### Étape 1 : Créer un compte

1. Aller sur [resend.com](https://resend.com)
2. Créer un compte
3. Obtenir une clé API

### Étape 2 : Configurer les variables d'environnement

```env
# .env.local
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@votre-domaine.fr
```

### Étape 3 : Mettre à jour src/lib/email.ts

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "MindSP <noreply@mindsp.fr>",
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return true;
  } catch (error) {
    console.error("Erreur envoi email:", error);
    return false;
  }
}
```

## Utilisation dans l'API

### Exemple : Envoi lors de l'inscription

```typescript
// Dans src/app/api/fmpa/[id]/register/route.ts

import { sendEmail, getRegistrationEmailTemplate } from "@/lib/email";

// Après la création de la participation
const emailHtml = getRegistrationEmailTemplate({
  userName: `${session.user.firstName} ${session.user.lastName}`,
  fmpaTitle: fmpa.title,
  fmpaType: fmpa.type,
  startDate: new Date(fmpa.startDate),
  location: fmpa.location,
  requiresApproval: fmpa.requiresApproval,
});

await sendEmail({
  to: session.user.email,
  subject: `Inscription confirmée - ${fmpa.title}`,
  html: emailHtml,
});
```

## Templates Disponibles

### 1. Email de Confirmation d'Inscription

- **Fonction** : `getRegistrationEmailTemplate()`
- **Quand** : Après inscription à une FMPA
- **Contient** : Détails FMPA, date, lieu, statut approbation

### 2. Email de Rappel

- **Fonction** : `getReminderEmailTemplate()`
- **Quand** : 24h avant la FMPA
- **Contient** : Rappel de la date, lieu, heure

## Automatisation des Rappels (Optionnel)

### Option 1 : Cron Job avec Vercel

```typescript
// src/app/api/cron/send-reminders/route.ts
export async function GET() {
  // Récupérer les FMPA de demain
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const fmpas = await prisma.fMPA.findMany({
    where: {
      startDate: {
        gte: tomorrow,
        lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
      },
      status: "PUBLISHED",
    },
    include: {
      participations: {
        include: { user: true },
      },
    },
  });

  // Envoyer les rappels
  for (const fmpa of fmpas) {
    for (const participation of fmpa.participations) {
      await sendEmail({
        to: participation.user.email,
        subject: `Rappel : ${fmpa.title} demain`,
        html: getReminderEmailTemplate({
          userName: `${participation.user.firstName} ${participation.user.lastName}`,
          fmpaTitle: fmpa.title,
          startDate: new Date(fmpa.startDate),
          location: fmpa.location,
        }),
      });
    }
  }

  return Response.json({ sent: fmpas.length });
}
```

### Option 2 : Queue avec BullMQ (Déjà installé)

```typescript
// Créer une queue pour les emails
import { Queue } from "bullmq";

const emailQueue = new Queue("emails", {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },
});

// Ajouter un job
await emailQueue.add(
  "send-reminder",
  {
    to: user.email,
    subject: "Rappel FMPA",
    html: emailHtml,
  },
  {
    delay: 24 * 60 * 60 * 1000, // 24h
  }
);
```

## Vérification du Domaine

Pour un taux de délivrabilité optimal :

1. **Configurer SPF** : Ajouter un enregistrement TXT DNS
2. **Configurer DKIM** : Authentification des emails
3. **Configurer DMARC** : Protection contre le spam

Resend fournit automatiquement ces configurations.

## Tests

### Test en développement

```typescript
// Utiliser Mailtrap ou MailHog pour tester
RESEND_API_KEY=test_key
EMAIL_FROM=test@example.com
```

### Test en production

```bash
# Envoyer un email de test
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "votre-email@example.com"}'
```

## Statut Actuel

✅ Templates HTML créés  
✅ Fonction sendEmail() prête  
✅ Templates de confirmation et rappel  
⏳ Service d'email à configurer (Resend recommandé)  
⏳ Intégration dans les API routes  
⏳ Cron job pour les rappels automatiques

## Prochaines Étapes

1. Choisir un service d'email (Resend recommandé)
2. Obtenir une clé API
3. Configurer les variables d'environnement
4. Mettre à jour `src/lib/email.ts`
5. Intégrer dans les routes API
6. (Optionnel) Configurer les rappels automatiques

## Coût Estimé

- **Resend** : Gratuit jusqu'à 3000 emails/mois
- **SendGrid** : Gratuit jusqu'à 100 emails/jour
- **AWS SES** : ~$1 pour 10,000 emails

Pour un SDIS moyen : **Gratuit** avec Resend ou SendGrid.
