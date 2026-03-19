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

11. Paralleliser les 6 requetes de /api/search
    - Fichier: src/app/api/search/route.ts
    - Probleme: 6 requetes DB sequentielles (chat, mail, fmpa, formations, documents, personnel)
    - Fix: envelopper dans Promise.all() pour execution parallele

12. Ajouter le cache Redis sur les endpoints manquants
    - src/app/api/mail/inbox/route.ts (TTL 5 min)
    - src/app/api/portals/route.ts (TTL 15 min)
    - src/app/api/fmpa/[id]/stats/route.ts (TTL 5 min)
    - src/app/api/fmpa/team-stats/route.ts (TTL 15 min)
    - src/app/api/notifications/stats/route.ts (TTL 5 min)

13. Standardiser les grilles responsives
    - Pattern cible: grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4
    - Fichiers concernes: AlertsDashboard.tsx, FormationsPage, multiples pages
    - Ajouter breakpoint sm: intermediaire la ou il manque

14. Ajouter des tailles de texte responsives
    - Remplacer text-3xl par text-2xl sm:text-3xl sur les titres de pages
    - Verifier le line-clamp sur les sujets de mails et titres d'articles

15. Ajouter priority sur les images LCP
    - Fichier: src/components/layout/Sidebar.tsx (logo)
    - Fix: ajouter prop priority={true} sur le composant Image du logo

16. Activer le slow query logging en production
    - Fichier: src/lib/prisma.ts
    - Probleme: seuil 500ms log uniquement en dev
    - Fix: logger aussi en production via logger.warn()
