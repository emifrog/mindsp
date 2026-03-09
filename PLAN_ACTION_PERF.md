# PLAN D'ACTION PAR PRIORITE

## P0 - CRITIQUE (gain immediat)
1. ~~Remplacer Iconify par des emojis Unicode natifs (-130 MB de bundle)~~ ✅ FAIT
   - Packages supprimes: @iconify/react, @iconify-json/fluent-emoji, @iconify-json/noto, @iconify-json/solar
   - Composant Icon reecrit avec emojis Unicode (0 KB de bundle)
   - Registre centralise dans src/lib/icons.ts
   - IconifyProvider et iconify-setup supprimes
   - Build statique passe de ~139 MB a ~88 KB shared JS
2. ~~Corriger le N+1 dans /api/fmpa/statistics avec groupBy()~~ ✅ FAIT
   - Taux de presence par FMPA: remplace Promise.all(map(count)) par un seul groupBy()
   - Heures de formation par user: remplace N requetes findUnique+findMany par un seul findMany + groupement en memoire
   - Reutilise le userMap deja calcule (plus de re-fetch des users)
3. ~~Ajouter du cache sur /api/search (6 requetes DB par appel)~~ ✅ FAIT
   - Cache Redis via CacheService.getOrSet avec TTL 5 minutes
   - Cle de cache basee sur tenant + query + type + dates + limit

## P1 - HAUTE PRIORITE
4. ~~Ajouter optimizePackageImports dans next.config.js~~ ✅ FAIT
   - Ajoute: ["lucide-react", "date-fns", "framer-motion"]
5. ~~Dynamic import framer-motion, xlsx, composants lourds~~ ✅ FAIT
   - framer-motion: gere par optimizePackageImports (imports uniquement dans composants animation dedies)
   - xlsx: uniquement dans API routes (server-side, pas d'impact bundle client)
6. ~~Cacher /api/users, /api/calendar/events, /api/news~~ ✅ FAIT
   - /api/users: cache Redis 5 min par tenant + search
   - /api/calendar/events: cache Redis 5 min par tenant + dates + type
   - /api/news: cache Redis 5 min par tenant + pagination + filtres
7. ~~Ajouter pagination a /api/conversations/[id]/messages~~ ✅ DEJA EN PLACE
   - Pagination offset-based deja implementee (skip/take, default limit=50)
8. ~~Remplacer Promise.all(map(create)) par createMany() dans messaging~~ ✅ FAIT
   - /api/messaging/lists/[id]/members: createMany avec skipDuplicates
   - /api/messaging/polls/[id]/vote: createMany pour les reponses

## P2 - MOYENNE PRIORITE
9. Ajouter useMemo sur les calculs couteux (groupedMessages, filteredChannels)
10. Extraire et memoiser ChannelItem comme composant separe
11. Paralleliser les fetches sequentiels (RecipientSelector, search)
12. Cascade d'invalidation du cache parent-enfant
13. Ajouter Prisma middleware pour detecter les requetes lentes en production
