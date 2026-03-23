/**
 * Classe de base pour tous les connecteurs d'integration
 * Gere l'authentification, les retries, et le logging
 */

import type { ConnectorConfig, SyncResult, SyncError } from "./types";

export abstract class BaseConnector {
  protected config: ConnectorConfig;
  protected errors: SyncError[] = [];

  constructor(config: ConnectorConfig) {
    this.config = {
      timeout: 30000,
      debug: false,
      ...config,
    };
  }

  /** Nom du connecteur pour les logs */
  abstract get name(): string;

  /** Tester la connexion a l'API externe */
  abstract testConnection(): Promise<boolean>;

  /**
   * Faire un appel HTTP a l'API externe
   */
  protected async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;

    if (this.config.debug) {
      console.log(`[${this.name}] ${options.method || "GET"} ${url}`);
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.timeout
    );

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
          "X-SDIS-ID": this.config.externalSdisId,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(
          `[${this.name}] HTTP ${response.status}: ${response.statusText}`
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        throw new Error(`[${this.name}] Timeout apres ${this.config.timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Executer une requete avec retry automatique
   */
  protected async requestWithRetry<T>(
    path: string,
    options: RequestInit = {},
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.request<T>(path, options);
      } catch (error) {
        lastError = error as Error;
        if (this.config.debug) {
          console.warn(
            `[${this.name}] Tentative ${attempt}/${maxRetries} echouee:`,
            lastError.message
          );
        }
        if (attempt < maxRetries) {
          await this.sleep(1000 * attempt); // Backoff exponentiel
        }
      }
    }

    throw lastError;
  }

  /**
   * Creer un resultat de synchronisation
   */
  protected createSyncResult(
    created: number,
    updated: number,
    skipped: number,
    startTime: number
  ): SyncResult {
    return {
      created,
      updated,
      skipped,
      errors: [...this.errors],
      duration: Date.now() - startTime,
      syncedAt: new Date(),
    };
  }

  /**
   * Ajouter une erreur de synchronisation
   */
  protected addError(externalId: string, message: string, code?: string) {
    this.errors.push({ externalId, message, code });
    if (this.config.debug) {
      console.error(`[${this.name}] Erreur sync ${externalId}: ${message}`);
    }
  }

  /**
   * Reinitialiser les erreurs avant une nouvelle sync
   */
  protected resetErrors() {
    this.errors = [];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
