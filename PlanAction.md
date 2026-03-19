# PLAN D'ACTION — PERFORMANCE, OPTIMISATION, MOBILE

## P0 - CRITIQUE (impact immediat)

1. ~~Corriger la boucle infinie dans use-toast.ts~~ ✅ FAIT
   - Fichier: src/hooks/use-toast.ts
   - Fix: useEffect dependance [state] remplacee par [] (setup unique)

2. ~~Corriger le layout Chat/Mailbox sur mobile~~ ✅ FAIT
   - ChatLayout.tsx: sidebar plein ecran sur mobile (overlay z-20), w-72 sur desktop
   - MailboxLayout.tsx: panel message plein ecran sur mobile avec bouton retour
   - Selection canal/dossier ferme automatiquement la sidebar sur mobile

3. ~~Ajouter scroll horizontal sur FMPATable~~ ✅ FAIT
   - Wrapper overflow-x-auto + min-w-[700px] sur la table

4. ~~Ajouter SWR pour la deduplication et le cache client~~ ✅ FAIT
   - Package swr@2.4.1 installe
   - use-notifications.ts migre vers useSWR avec mutations optimistes
   - Fetcher reutilisable cree dans src/lib/fetcher.ts
   - Deduplication 30s, pas de revalidation au focus

## P1 - HAUTE PRIORITE

5. ~~Ajouter useMemo sur les calculs couteux~~ ✅ FAIT
   - TTAStats.tsx: 13 reduce/filter enveloppes dans useMemo([entries])
   - FMPACalendar.tsx: getFMPAsForDate remplace par Map memoisee fmpasByDate
   - FormationsCalendar.tsx: getFormationsForDate remplace par Map memoisee formationsByDate
   - TTACalendar.tsx: getEntriesForDate remplace par Map memoisee entriesByDate
   - CalendarGrid.tsx: eventsByDay et daysWithEvents enveloppes dans useMemo

6. ~~Ajouter React.memo sur les items de listes~~ ✅ FAIT
   - Message.tsx: export enveloppe dans React.memo
   - ParticipantsList.tsx: ParticipantItem extrait et enveloppe dans React.memo
   - QualificationsList.tsx: QualificationItem extrait et enveloppe dans React.memo
   - EventCard.tsx: export enveloppe dans React.memo

7. ~~Rendre le dropdown NotificationBell responsive~~ ✅ FAIT
   - NotificationBell.tsx: w-96 max-w-[calc(100vw-2rem)]

8. ~~Augmenter les touch targets a 44px minimum~~ ✅ FAIT
   - Header.tsx: boutons passes a h-10 w-10 md:h-9 md:w-9

9. ~~Remplacer img par next/image dans FilePreview~~ ✅ FAIT
   - FilePreview.tsx: Image de next/image avec fill + object-cover

10. ~~Charger le service worker en lazy~~ ✅ FAIT
    - layout.tsx: Script strategy="lazyOnload" id="sw-register"

## P2 - MOYENNE PRIORITE

11. ~~Paralleliser les 6 requetes de /api/search~~ ✅ FAIT
    - 6 requetes sequentielles remplacees par Promise.all()
    - Filtre de dates factorise dans un helper dateFilter()
    - .catch(() => []) sur chaque requete pour resilience

12. ~~Ajouter le cache Redis sur les endpoints manquants~~ ✅ FAIT
    - /api/mail/inbox: cache 5 min (cle par tenant+user+page)
    - /api/portals: cache 15 min (cle par tenant)
    - /api/fmpa/[id]/stats: cache 5 min (cle par fmpa id)
    - /api/fmpa/team-stats: cache 15 min (cle par tenant+period, bypass pour Excel)
    - /api/notifications/stats: cache 5 min (cle par user)

13. ~~Standardiser les grilles responsives~~ ✅ FAIT
    - AlertsDashboard.tsx: ajout sm:grid-cols-2 avant md:grid-cols-4
    - CareerTimeline.tsx: ajout sm:grid-cols-2 avant md:grid-cols-3
    - FMPAStatistics.tsx: ajout sm:grid-cols-2 avant md:grid-cols-4

14. ~~Ajouter des tailles de texte responsives~~ ✅ FAIT
    - 30 pages: text-3xl remplace par text-2xl sm:text-3xl sur tous les titres h1

15. ~~Ajouter priority sur les images LCP~~ ✅ DEJA EN PLACE
    - Sidebar.tsx: logo deja avec priority={true}

16. ~~Activer le slow query logging en production~~ ✅ DEJA EN PLACE
    - prisma.ts: middleware $use log les requetes > 500ms independamment de NODE_ENV

---

# PLAN D'ACTION — COMMERCIALISATION

Score actuel: 35/100 — Objectif: 85/100

## P0 - BLOQUANT LEGAL ET MARKETING (obligatoire avant mise en ligne)

17. Creer une landing page publique (hero, features, CTA, demo)
    - Route: / (page publique, pas derriere auth)
    - Hero section avec value proposition
    - Section features (8 modules)
    - Section temoignages / cas d'usage SDIS
    - CTA inscription / demande de demo
    - Footer avec liens legaux

18. Ajouter les pages legales (obligatoire loi francaise + RGPD)
    - /mentions-legales : editeur, hebergeur, DPO
    - /politique-de-confidentialite : collecte, traitement, duree, droits
    - /cgu : conditions generales d'utilisation
    - Liens dans le footer de toutes les pages

19. ~~Ajouter un bandeau de consentement cookies (RGPD)~~ ✅ FAIT
    - Composant CookieConsent.tsx cree dans src/components/
    - Bandeau responsive fixe en bas, boutons Accepter/Refuser
    - Choix stocke en localStorage + cookie cookie-consent
    - Helper hasAnalyticsConsent() pour conditionner analytics
    - Integre dans layout.tsx global

20. ~~Retirer les identifiants test de la page login~~ ✅ FAIT
    - Bloc credentials enveloppe dans process.env.NODE_ENV === "development"
    - Invisible en production, visible en dev uniquement

21. Ajouter les OG tags, robots.txt et sitemap.xml
    - Metadata OpenGraph + Twitter Cards dans layout.tsx
    - public/robots.txt avec Allow/Disallow
    - src/app/sitemap.ts pour generation dynamique
    - public/og-image.png (1200x630)

## P1 - INFRASTRUCTURE CRITIQUE (necessaire pour fiabilite)

22. Implementer l'envoi d'emails fonctionnel (Resend)
    - Remplacer le console.log dans src/lib/email.ts par Resend API
    - Templates: bienvenue, reset password, confirmation inscription
    - Variable RESEND_API_KEY dans .env

23. Ajouter Sentry pour le tracking d'erreurs
    - npm install @sentry/nextjs
    - Configurer sentry.client.config.ts + sentry.server.config.ts
    - Connecter error.tsx et error boundary au reporting Sentry

24. Creer un endpoint /api/health fonctionnel
    - Verifier: DB connectee, Redis accessible, version app
    - Retourner status 200 avec uptime et checks

25. Mettre en place GitHub Actions CI/CD
    - .github/workflows/ci.yml: lint + tsc + build sur chaque PR
    - .github/workflows/deploy.yml: deploy Vercel sur push main

26. Ajouter un flux d'onboarding post-inscription
    - Wizard 3 etapes: profil, preferences notifications, decouverte features
    - Flag user.onboardingCompleted dans le schema Prisma
    - Redirection automatique si onboarding non fait

## P2 - MONETISATION (necessaire pour revenus)

27. Integrer Stripe pour les abonnements
    - npm install stripe @stripe/stripe-js
    - Modeles Prisma: Subscription, Invoice
    - Webhooks Stripe: /api/webhooks/stripe
    - Portail billing self-service

28. Definir les tiers de pricing
    - Gratuit: 1 caserne, 10 users, fonctions de base
    - Pro: casernes illimitees, 50 users, toutes fonctions
    - Enterprise: illimite, SSO, support prioritaire, API
    - Page /pricing publique

29. Implementer l'enforcement du trial
    - Duree: 30 jours apres creation tenant
    - Bandeau d'avertissement J-7, J-3, J-1
    - Blocage fonctionnel a J+0 (lecture seule)
    - Logique dans middleware.ts

## P3 - ANALYTICS ET POLISH (necessaire pour croissance)

30. Integrer Plausible ou PostHog pour les analytics
    - Script analytics dans layout.tsx (conditionne par consentement cookies)
    - Tracking: pages vues, features utilisees, retention

31. Creer la documentation utilisateur
    - /aide ou /docs : guide de demarrage, FAQ
    - Accessible depuis le menu utilisateur
    - Contenu statique MDX

32. Ajouter un changelog public
    - /changelog : liste des mises a jour
    - Badge "Nouveau" dans le menu quand nouvelle version

33. Ajouter le monitoring Core Web Vitals
    - next/web-vitals reporting vers analytics
    - Alerte si LCP > 2.5s ou CLS > 0.1
