/**
 * Types communs pour les connecteurs d'integration externes
 * Antibia (gestion operationnelle SDIS) et LGTP (gestion temps/plannings)
 */

// ═══════════════════════════════════════════
// Configuration connecteur
// ═══════════════════════════════════════════

export interface ConnectorConfig {
  /** URL de base de l'API externe */
  baseUrl: string;
  /** Cle d'API ou token d'authentification */
  apiKey: string;
  /** ID du SDIS dans le systeme externe */
  externalSdisId: string;
  /** Timeout en ms pour les requetes */
  timeout?: number;
  /** Activer le mode debug */
  debug?: boolean;
}

export interface SyncOptions {
  /** Date de debut de la periode de synchronisation */
  from?: Date;
  /** Date de fin de la periode de synchronisation */
  to?: Date;
  /** Forcer la resynchronisation complete */
  fullSync?: boolean;
  /** Nombre max d'elements a synchroniser */
  limit?: number;
}

export interface SyncResult {
  /** Nombre d'elements crees */
  created: number;
  /** Nombre d'elements mis a jour */
  updated: number;
  /** Nombre d'elements ignores (inchanges) */
  skipped: number;
  /** Erreurs rencontrees */
  errors: SyncError[];
  /** Duree de la synchronisation en ms */
  duration: number;
  /** Timestamp de la synchronisation */
  syncedAt: Date;
}

export interface SyncError {
  /** ID de l'element externe */
  externalId: string;
  /** Message d'erreur */
  message: string;
  /** Code d'erreur */
  code?: string;
}

// ═══════════════════════════════════════════
// Antibia - Gestion operationnelle
// ═══════════════════════════════════════════

/** Intervention depuis Antibia */
export interface AntibiaIntervention {
  id: string;
  /** Numero d'intervention (ex: 2026-INT-001234) */
  numero: string;
  /** Type: SAP, INC, DIV, etc. */
  type: string;
  /** Motif de l'intervention */
  motif: string;
  /** Adresse de l'intervention */
  adresse: string;
  commune: string;
  /** Date/heure de depart */
  dateDepart: Date;
  /** Date/heure de retour */
  dateRetour?: Date;
  /** Duree en minutes */
  duree?: number;
  /** Statut */
  statut: "EN_COURS" | "TERMINEE" | "ANNULEE";
  /** Engins engages */
  engins: AntibiaEngin[];
  /** Personnel engage */
  personnel: AntibiaPersonnel[];
}

export interface AntibiaEngin {
  id: string;
  /** Code engin (ex: VSAV01, FPT02) */
  code: string;
  type: string;
  centreSecours: string;
}

export interface AntibiaPersonnel {
  id: string;
  /** Matricule agent */
  matricule: string;
  nom: string;
  prenom: string;
  grade: string;
  /** Role dans l'intervention */
  role: "CHEF_AGRES" | "EQUIPIER" | "CONDUCTEUR" | "MEDECIN" | "INFIRMIER";
}

/** Garde depuis Antibia */
export interface AntibiaGarde {
  id: string;
  /** Matricule de l'agent */
  matricule: string;
  /** Centre de secours */
  centreSecours: string;
  /** Date de debut de garde */
  dateDebut: Date;
  /** Date de fin de garde */
  dateFin: Date;
  /** Type de garde */
  type: "GARDE_24H" | "GARDE_12H" | "ASTREINTE" | "PIQUET";
}

/** Disponibilite agent depuis Antibia */
export interface AntibiaDisponibilite {
  id: string;
  matricule: string;
  /** Statut de disponibilite */
  statut: "DISPONIBLE" | "INDISPONIBLE" | "EN_INTERVENTION";
  /** Date de debut */
  dateDebut: Date;
  /** Date de fin */
  dateFin?: Date;
  motif?: string;
}

// ═══════════════════════════════════════════
// LGTP - Gestion des temps et plannings
// ═══════════════════════════════════════════

/** Entree de temps depuis LGTP */
export interface LGTPTemps {
  id: string;
  /** Matricule de l'agent */
  matricule: string;
  /** Date du jour */
  date: Date;
  /** Type d'activite */
  type: "GARDE" | "ASTREINTE" | "FORMATION" | "FMPA" | "REPOS" | "CONGE" | "MALADIE" | "INTERVENTION";
  /** Heure de debut */
  heureDebut: string;
  /** Heure de fin */
  heureFin: string;
  /** Duree en heures */
  duree: number;
  /** Commentaire */
  commentaire?: string;
  /** Valide par un superieur */
  valide: boolean;
}

/** Planning depuis LGTP */
export interface LGTPPlanning {
  id: string;
  /** Mois/annee du planning */
  mois: number;
  annee: number;
  /** Centre de secours */
  centreSecours: string;
  /** Lignes du planning */
  lignes: LGTPPlanningLigne[];
}

export interface LGTPPlanningLigne {
  matricule: string;
  nom: string;
  prenom: string;
  /** Jours du mois: type d'activite par jour */
  jours: Record<number, string>;
}

/** Compteur d'heures depuis LGTP */
export interface LGTPCompteur {
  matricule: string;
  annee: number;
  /** Heures de garde effectuees */
  heuresGarde: number;
  /** Heures d'astreinte effectuees */
  heuresAstreinte: number;
  /** Heures de formation effectuees */
  heuresFormation: number;
  /** Heures FMPA effectuees */
  heuresFMPA: number;
  /** Jours de conge restants */
  congesRestants: number;
  /** Jours de repos compensatoire */
  reposCompensatoire: number;
}
