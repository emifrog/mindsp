/**
 * Service de cache Redis réutilisable
 * Utilise Upstash Redis pour le caching des données fréquemment accédées
 */

import { Redis } from "@upstash/redis";

// Instance Redis partagée (lazy pour éviter le crash au build)
let _redis: Redis | null = null;

function getRedis(): Redis {
  if (!_redis) {
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      throw new Error("UPSTASH_REDIS_REST_URL is required");
    }
    if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error("UPSTASH_REDIS_REST_TOKEN is required");
    }
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return _redis;
}

/**
 * TTL par défaut pour différents types de données (en secondes)
 */
export const CACHE_TTL = {
  SESSION: 60 * 60, // 1 heure
  USER_PROFILE: 60 * 30, // 30 minutes
  LIST_SHORT: 60 * 5, // 5 minutes (listes FMPA, formations)
  LIST_LONG: 60 * 15, // 15 minutes (stats, dashboard)
  STATIC: 60 * 60 * 24, // 24 heures (données rarement modifiées)
} as const;

/**
 * Préfixes pour organiser les clés Redis
 */
export const CACHE_PREFIX = {
  SESSION: "session:",
  USER: "user:",
  FMPA: "fmpa:",
  FORMATION: "formation:",
  PERSONNEL: "personnel:",
  CONVERSATION: "conversation:",
  NOTIFICATION: "notification:",
  TTA: "tta:",
  STATS: "stats:",
  CHAT: "chat:",
} as const;

/**
 * Interface pour les options de cache
 */
interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

/**
 * Service de cache principal
 */
export class CacheService {
  /**
   * Récupérer une valeur du cache
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await getRedis().get<T>(key);
      return value;
    } catch (error) {
      console.error(`Cache GET error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Définir une valeur dans le cache
   */
  static async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const { ttl = CACHE_TTL.LIST_SHORT } = options;
      await getRedis().set(key, value, { ex: ttl });
      return true;
    } catch (error) {
      console.error(`Cache SET error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Supprimer une clé du cache
   */
  static async delete(key: string): Promise<boolean> {
    try {
      await getRedis().del(key);
      return true;
    } catch (error) {
      console.error(`Cache DELETE error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Supprimer plusieurs clés par pattern
   */
  static async deletePattern(pattern: string): Promise<number> {
    try {
      const r = getRedis();
      const keys = await r.keys(pattern);
      if (keys.length === 0) return 0;

      await r.del(...keys);
      return keys.length;
    } catch (error) {
      console.error(`Cache DELETE PATTERN error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Vérifier si une clé existe
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const result = await getRedis().exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Wrapper pour cache-aside pattern
   * Récupère du cache ou exécute la fonction et met en cache
   */
  static async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Essayer de récupérer du cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Si pas en cache, exécuter la fonction
    const data = await fetchFn();

    // Mettre en cache pour la prochaine fois
    await this.set(key, data, options);

    return data;
  }

  /**
   * Incrémenter une valeur (utile pour les compteurs)
   */
  static async increment(key: string, amount: number = 1): Promise<number> {
    try {
      return await getRedis().incrby(key, amount);
    } catch (error) {
      console.error(`Cache INCREMENT error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Définir un TTL sur une clé existante
   */
  static async expire(key: string, seconds: number): Promise<boolean> {
    try {
      await getRedis().expire(key, seconds);
      return true;
    } catch (error) {
      console.error(`Cache EXPIRE error for key ${key}:`, error);
      return false;
    }
  }
}

/**
 * Helpers spécifiques pour différents types de données
 */

/**
 * Cache pour les listes FMPA
 */
export async function cacheFMPAList(
  tenantId: string,
  filters: Record<string, unknown>,
  data: unknown
): Promise<void> {
  const filterKey = JSON.stringify(filters);
  const key = `${CACHE_PREFIX.FMPA}list:${tenantId}:${filterKey}`;
  await CacheService.set(key, data, { ttl: CACHE_TTL.LIST_SHORT });
}

export async function getCachedFMPAList(
  tenantId: string,
  filters: Record<string, unknown>
): Promise<unknown> {
  const filterKey = JSON.stringify(filters);
  const key = `${CACHE_PREFIX.FMPA}list:${tenantId}:${filterKey}`;
  return await CacheService.get(key);
}

export async function invalidateFMPACache(tenantId: string): Promise<void> {
  await CacheService.deletePattern(`${CACHE_PREFIX.FMPA}*:${tenantId}:*`);
}

/**
 * Cache pour les listes de formations
 */
export async function cacheFormationList(
  tenantId: string,
  filters: Record<string, unknown>,
  data: unknown
): Promise<void> {
  const filterKey = JSON.stringify(filters);
  const key = `${CACHE_PREFIX.FORMATION}list:${tenantId}:${filterKey}`;
  await CacheService.set(key, data, { ttl: CACHE_TTL.LIST_SHORT });
}

export async function getCachedFormationList(
  tenantId: string,
  filters: Record<string, unknown>
): Promise<unknown> {
  const filterKey = JSON.stringify(filters);
  const key = `${CACHE_PREFIX.FORMATION}list:${tenantId}:${filterKey}`;
  return await CacheService.get(key);
}

export async function invalidateFormationCache(
  tenantId: string
): Promise<void> {
  await CacheService.deletePattern(`${CACHE_PREFIX.FORMATION}*:${tenantId}:*`);
}

/**
 * Cache pour les profils utilisateur
 */
export async function cacheUserProfile(
  userId: string,
  data: unknown
): Promise<void> {
  const key = `${CACHE_PREFIX.USER}profile:${userId}`;
  await CacheService.set(key, data, { ttl: CACHE_TTL.USER_PROFILE });
}

export async function getCachedUserProfile(
  userId: string
): Promise<unknown> {
  const key = `${CACHE_PREFIX.USER}profile:${userId}`;
  return await CacheService.get(key);
}

export async function invalidateUserCache(userId: string): Promise<void> {
  await CacheService.deletePattern(`${CACHE_PREFIX.USER}*:${userId}*`);
}

/**
 * Cache pour les fiches personnel
 */
export async function cachePersonnelList(
  tenantId: string,
  filters: Record<string, unknown>,
  data: unknown
): Promise<void> {
  const filterKey = JSON.stringify(filters);
  const key = `${CACHE_PREFIX.PERSONNEL}list:${tenantId}:${filterKey}`;
  await CacheService.set(key, data, { ttl: CACHE_TTL.LIST_SHORT });
}

export async function getCachedPersonnelList(
  tenantId: string,
  filters: Record<string, unknown>
): Promise<unknown> {
  const filterKey = JSON.stringify(filters);
  const key = `${CACHE_PREFIX.PERSONNEL}list:${tenantId}:${filterKey}`;
  return await CacheService.get(key);
}

export async function invalidatePersonnelCache(
  tenantId: string
): Promise<void> {
  await CacheService.deletePattern(`${CACHE_PREFIX.PERSONNEL}*:${tenantId}:*`);
}

/**
 * Cache pour les conversations
 */
export async function cacheConversationList(
  tenantId: string,
  userId: string,
  filters: Record<string, unknown>,
  data: unknown
): Promise<void> {
  const filterKey = JSON.stringify(filters);
  const key = `${CACHE_PREFIX.CONVERSATION}list:${tenantId}:${userId}:${filterKey}`;
  await CacheService.set(key, data, { ttl: CACHE_TTL.LIST_SHORT });
}

export async function getCachedConversationList(
  tenantId: string,
  userId: string,
  filters: Record<string, unknown>
): Promise<unknown> {
  const filterKey = JSON.stringify(filters);
  const key = `${CACHE_PREFIX.CONVERSATION}list:${tenantId}:${userId}:${filterKey}`;
  return await CacheService.get(key);
}

export async function invalidateConversationCache(
  tenantId: string,
  userId?: string
): Promise<void> {
  if (userId) {
    await CacheService.deletePattern(
      `${CACHE_PREFIX.CONVERSATION}*:${tenantId}:${userId}:*`
    );
  } else {
    await CacheService.deletePattern(
      `${CACHE_PREFIX.CONVERSATION}*:${tenantId}:*`
    );
  }
}

/**
 * Cache pour les notifications
 */
export async function cacheNotificationList(
  userId: string,
  filters: Record<string, unknown>,
  data: unknown
): Promise<void> {
  const filterKey = JSON.stringify(filters);
  const key = `${CACHE_PREFIX.NOTIFICATION}list:${userId}:${filterKey}`;
  await CacheService.set(key, data, { ttl: CACHE_TTL.LIST_SHORT });
}

export async function getCachedNotificationList(
  userId: string,
  filters: Record<string, unknown>
): Promise<unknown> {
  const filterKey = JSON.stringify(filters);
  const key = `${CACHE_PREFIX.NOTIFICATION}list:${userId}:${filterKey}`;
  return await CacheService.get(key);
}

export async function invalidateNotificationCache(
  userId: string
): Promise<void> {
  await CacheService.deletePattern(`${CACHE_PREFIX.NOTIFICATION}*:${userId}:*`);
}

/**
 * Cache pour les entrées TTA
 */
export async function cacheTTAList(
  tenantId: string,
  filters: Record<string, unknown>,
  data: unknown
): Promise<void> {
  const filterKey = JSON.stringify(filters);
  const key = `${CACHE_PREFIX.TTA}list:${tenantId}:${filterKey}`;
  await CacheService.set(key, data, { ttl: CACHE_TTL.LIST_SHORT });
}

export async function getCachedTTAList(
  tenantId: string,
  filters: Record<string, unknown>
): Promise<unknown> {
  const filterKey = JSON.stringify(filters);
  const key = `${CACHE_PREFIX.TTA}list:${tenantId}:${filterKey}`;
  return await CacheService.get(key);
}

export async function invalidateTTACache(tenantId: string): Promise<void> {
  await CacheService.deletePattern(`${CACHE_PREFIX.TTA}*:${tenantId}:*`);
}

/**
 * Cache pour les canaux chat
 */
export async function cacheChatChannelList(
  tenantId: string,
  userId: string,
  filters: Record<string, unknown>,
  data: unknown
): Promise<void> {
  const filterKey = JSON.stringify(filters);
  const key = `${CACHE_PREFIX.CHAT}channels:${tenantId}:${userId}:${filterKey}`;
  await CacheService.set(key, data, { ttl: CACHE_TTL.LIST_SHORT });
}

export async function getCachedChatChannelList(
  tenantId: string,
  userId: string,
  filters: Record<string, unknown>
): Promise<unknown> {
  const filterKey = JSON.stringify(filters);
  const key = `${CACHE_PREFIX.CHAT}channels:${tenantId}:${userId}:${filterKey}`;
  return await CacheService.get(key);
}

export async function invalidateChatChannelCache(
  tenantId: string,
  userId?: string
): Promise<void> {
  if (userId) {
    await CacheService.deletePattern(
      `${CACHE_PREFIX.CHAT}*:${tenantId}:${userId}:*`
    );
  } else {
    await CacheService.deletePattern(`${CACHE_PREFIX.CHAT}*:${tenantId}:*`);
  }
}

/**
 * Cache pour les stats dashboard
 */
export async function cacheStats(
  tenantId: string,
  type: string,
  data: unknown
): Promise<void> {
  const key = `${CACHE_PREFIX.STATS}${type}:${tenantId}`;
  await CacheService.set(key, data, { ttl: CACHE_TTL.LIST_LONG });
}

export async function getCachedStats(
  tenantId: string,
  type: string
): Promise<unknown> {
  const key = `${CACHE_PREFIX.STATS}${type}:${tenantId}`;
  return await CacheService.get(key);
}

export async function invalidateStatsCache(tenantId: string): Promise<void> {
  await CacheService.deletePattern(`${CACHE_PREFIX.STATS}*:${tenantId}`);
}

/**
 * Exemple d'utilisation :
 *
 * ```typescript
 * import { CacheService, getCachedFMPAList, cacheFMPAList, invalidateFMPACache } from "@/lib/cache";
 *
 * // Dans une route API GET
 * export async function GET(request: NextRequest) {
 *   const session = await auth();
 *   const filters = { status: "ACTIVE" };
 *
 *   // Essayer de récupérer du cache
 *   const cached = await getCachedFMPAList(session.user.tenantId, filters);
 *   if (cached) {
 *     return NextResponse.json(cached);
 *   }
 *
 *   // Si pas en cache, récupérer de la DB
 *   const data = await prisma.fMPA.findMany({ where: filters });
 *
 *   // Mettre en cache
 *   await cacheFMPAList(session.user.tenantId, filters, data);
 *
 *   return NextResponse.json(data);
 * }
 *
 * // Dans une route API POST/PUT/DELETE
 * export async function POST(request: NextRequest) {
 *   const session = await auth();
 *
 *   // Créer/modifier la ressource
 *   const fmpa = await prisma.fMPA.create({ data: ... });
 *
 *   // Invalider le cache
 *   await invalidateFMPACache(session.user.tenantId);
 *
 *   return NextResponse.json(fmpa);
 * }
 * ```
 */
