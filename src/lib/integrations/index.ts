/**
 * Point d'entree des integrations externes
 *
 * Usage:
 *   import { createAntibiaConnector, createLGTPConnector, createMicrosoft365Connector } from "@/lib/integrations";
 *
 *   const antibia = createAntibiaConnector();
 *   const result = await antibia.syncInterventions(tenantId);
 *
 *   const lgtp = createLGTPConnector();
 *   const result = await lgtp.syncTemps(tenantId);
 *
 *   const ms365 = createMicrosoft365Connector();
 *   const result = await ms365.syncCalendar(tenantId, "agent@sdis06.fr");
 */

export { AntibiaConnector } from "./antibia-connector";
export { LGTPConnector } from "./lgtp-connector";
export { Microsoft365Connector } from "./microsoft-connector";
export { BaseConnector } from "./base-connector";
export type * from "./types";
export type * from "./microsoft-types";

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

/**
 * Creer un connecteur Microsoft 365 a partir des variables d'environnement
 */
export function createMicrosoft365Connector() {
  const tenantId = process.env.MS365_TENANT_ID;
  const clientId = process.env.MS365_CLIENT_ID;
  const clientSecret = process.env.MS365_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Variables MS365_TENANT_ID, MS365_CLIENT_ID et MS365_CLIENT_SECRET requises"
    );
  }

  const { Microsoft365Connector } = require("./microsoft-connector");
  return new Microsoft365Connector({
    tenantId,
    clientId,
    clientSecret,
    debug: process.env.NODE_ENV === "development",
  });
}
