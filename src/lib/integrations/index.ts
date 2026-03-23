/**
 * Point d'entree des integrations externes
 *
 * Usage:
 *   import { createAntibiaConnector, createLGTPConnector } from "@/lib/integrations";
 *
 *   const antibia = createAntibiaConnector();
 *   const result = await antibia.syncInterventions(tenantId);
 *
 *   const lgtp = createLGTPConnector();
 *   const result = await lgtp.syncTemps(tenantId);
 */

export { AntibiaConnector } from "./antibia-connector";
export { LGTPConnector } from "./lgtp-connector";
export { BaseConnector } from "./base-connector";
export type * from "./types";

/**
 * Creer un connecteur Antibia a partir des variables d'environnement
 */
export function createAntibiaConnector() {
  const baseUrl = process.env.ANTIBIA_API_URL;
  const apiKey = process.env.ANTIBIA_API_KEY;
  const externalSdisId = process.env.ANTIBIA_SDIS_ID;

  if (!baseUrl || !apiKey || !externalSdisId) {
    throw new Error(
      "Variables ANTIBIA_API_URL, ANTIBIA_API_KEY et ANTIBIA_SDIS_ID requises"
    );
  }

  return new (require("./antibia-connector").AntibiaConnector)({
    baseUrl,
    apiKey,
    externalSdisId,
    debug: process.env.NODE_ENV === "development",
  });
}

/**
 * Creer un connecteur LGTP a partir des variables d'environnement
 */
export function createLGTPConnector() {
  const baseUrl = process.env.LGTP_API_URL;
  const apiKey = process.env.LGTP_API_KEY;
  const externalSdisId = process.env.LGTP_SDIS_ID;

  if (!baseUrl || !apiKey || !externalSdisId) {
    throw new Error(
      "Variables LGTP_API_URL, LGTP_API_KEY et LGTP_SDIS_ID requises"
    );
  }

  return new (require("./lgtp-connector").LGTPConnector)({
    baseUrl,
    apiKey,
    externalSdisId,
    debug: process.env.NODE_ENV === "development",
  });
}
