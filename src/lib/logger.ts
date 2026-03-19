/**
 * Service de logging structuré pour la production
 * Fournit des logs JSON en production et des logs lisibles en développement
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
  };
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === "production" ? "info" : "debug");

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatLog(entry: LogEntry): string {
  if (process.env.NODE_ENV === "production") {
    return JSON.stringify(entry);
  }

  const prefix = {
    debug: "🔍",
    info: "ℹ️",
    warn: "⚠️",
    error: "❌",
  }[entry.level];

  const ctx = entry.context ? ` [${entry.context}]` : "";
  const data = entry.data ? ` ${JSON.stringify(entry.data)}` : "";
  return `${prefix}${ctx} ${entry.message}${data}`;
}

function log(
  level: LogLevel,
  message: string,
  context?: string,
  data?: Record<string, unknown>,
  error?: Error
) {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    data,
  };

  if (error) {
    entry.error = {
      message: error.message,
      stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
    };
  }

  const formatted = formatLog(entry);

  switch (level) {
    case "debug":
      console.debug(formatted);
      break;
    case "info":
      console.info(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "error":
      console.error(formatted);
      break;
  }
}

/**
 * Logger avec contexte optionnel
 */
export const logger = {
  debug: (message: string, data?: Record<string, unknown>) =>
    log("debug", message, undefined, data),
  info: (message: string, data?: Record<string, unknown>) =>
    log("info", message, undefined, data),
  warn: (message: string, data?: Record<string, unknown>) =>
    log("warn", message, undefined, data),
  error: (message: string, error?: Error, data?: Record<string, unknown>) =>
    log("error", message, undefined, data, error),

  /**
   * Créer un logger avec un contexte (nom de module/service)
   */
  withContext: (context: string) => ({
    debug: (message: string, data?: Record<string, unknown>) =>
      log("debug", message, context, data),
    info: (message: string, data?: Record<string, unknown>) =>
      log("info", message, context, data),
    warn: (message: string, data?: Record<string, unknown>) =>
      log("warn", message, context, data),
    error: (message: string, error?: Error, data?: Record<string, unknown>) =>
      log("error", message, context, data, error),
  }),
};

/**
 * Middleware pour logger les requêtes API lentes
 */
export function logSlowRequest(
  route: string,
  startTime: number,
  thresholdMs: number = 1000
) {
  const duration = Date.now() - startTime;
  if (duration > thresholdMs) {
    logger.warn(`Slow API request: ${route}`, {
      route,
      durationMs: duration,
      threshold: thresholdMs,
    });
  }
}
