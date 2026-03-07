import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

/**
 * Types d'actions auditées
 */
export enum AuditAction {
  // FMPA
  CREATE_FMPA = "CREATE_FMPA",
  UPDATE_FMPA = "UPDATE_FMPA",
  DELETE_FMPA = "DELETE_FMPA",
  REGISTER_FMPA = "REGISTER_FMPA",
  UNREGISTER_FMPA = "UNREGISTER_FMPA",
  VALIDATE_FMPA = "VALIDATE_FMPA",
  EXPORT_FMPA = "EXPORT_FMPA",

  // Personnel
  CREATE_PERSONNEL = "CREATE_PERSONNEL",
  UPDATE_PERSONNEL = "UPDATE_PERSONNEL",
  DELETE_PERSONNEL = "DELETE_PERSONNEL",
  UPDATE_MEDICAL_STATUS = "UPDATE_MEDICAL_STATUS",
  ADD_QUALIFICATION = "ADD_QUALIFICATION",
  DELETE_QUALIFICATION = "DELETE_QUALIFICATION",

  // Formations
  CREATE_FORMATION = "CREATE_FORMATION",
  UPDATE_FORMATION = "UPDATE_FORMATION",
  DELETE_FORMATION = "DELETE_FORMATION",
  REGISTER_FORMATION = "REGISTER_FORMATION",
  VALIDATE_FORMATION = "VALIDATE_FORMATION",
  GENERATE_CERTIFICATE = "GENERATE_CERTIFICATE",

  // TTA
  CREATE_TTA = "CREATE_TTA",
  UPDATE_TTA = "UPDATE_TTA",
  DELETE_TTA = "DELETE_TTA",
  VALIDATE_TTA = "VALIDATE_TTA",
  EXPORT_TTA = "EXPORT_TTA",

  // Users
  CREATE_USER = "CREATE_USER",
  UPDATE_USER = "UPDATE_USER",
  DELETE_USER = "DELETE_USER",
  UPDATE_USER_ROLE = "UPDATE_USER_ROLE",
  UPDATE_USER_STATUS = "UPDATE_USER_STATUS",
  UPDATE_USER_PERMISSIONS = "UPDATE_USER_PERMISSIONS",

  // Tenant
  UPDATE_TENANT = "UPDATE_TENANT",
  DELETE_TENANT = "DELETE_TENANT",

  // Auth
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  FAILED_LOGIN = "FAILED_LOGIN",
  PASSWORD_RESET = "PASSWORD_RESET",

  // Exports
  EXPORT_DATA = "EXPORT_DATA",
  BULK_DELETE = "BULK_DELETE",
}

/**
 * Types d'entités auditées
 */
export enum AuditEntity {
  FMPA = "FMPA",
  PERSONNEL = "PERSONNEL",
  FORMATION = "FORMATION",
  TTA = "TTA",
  USER = "USER",
  TENANT = "TENANT",
  PARTICIPATION = "PARTICIPATION",
  QUALIFICATION = "QUALIFICATION",
  MEDICAL_STATUS = "MEDICAL_STATUS",
}

/**
 * Interface pour les données d'audit
 */
export interface AuditLogData {
  tenantId?: string;
  userId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  changes?: {
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Logger une action dans l'audit log
 */
export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    // Récupérer les informations de la requête
    const headersList = headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
      headersList.get("x-real-ip") ||
      "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    // Créer l'entrée d'audit
    await prisma.auditLog.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        changes: data.changes ? (data.changes as object) : undefined,
        metadata: {
          ipAddress,
          userAgent,
          timestamp: new Date().toISOString(),
          ...data.metadata,
        } as object,
      },
    });
  } catch (error) {
    // Ne pas bloquer l'opération si l'audit échoue
    console.error("Erreur lors de l'audit log:", error);
  }
}

/**
 * Logger une suppression avec les données avant suppression
 */
export async function logDeletion(
  userId: string,
  tenantId: string,
  entity: AuditEntity,
  entityId: string,
  dataBeforeDeletion: Record<string, unknown>
): Promise<void> {
  const action = `DELETE_${entity}` as AuditAction;

  await logAudit({
    userId,
    tenantId,
    action,
    entity,
    entityId,
    changes: {
      before: dataBeforeDeletion,
      after: null,
    },
  });
}

/**
 * Logger une modification avec avant/après
 */
export async function logUpdate(
  userId: string,
  tenantId: string,
  entity: AuditEntity,
  entityId: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Promise<void> {
  const action = `UPDATE_${entity}` as AuditAction;

  await logAudit({
    userId,
    tenantId,
    action,
    entity,
    entityId,
    changes: {
      before,
      after,
    },
  });
}

/**
 * Logger une création
 */
export async function logCreation(
  userId: string,
  tenantId: string,
  entity: AuditEntity,
  entityId: string,
  data: Record<string, unknown>
): Promise<void> {
  const action = `CREATE_${entity}` as AuditAction;

  await logAudit({
    userId,
    tenantId,
    action,
    entity,
    entityId,
    changes: {
      before: null,
      after: data,
    },
  });
}

/**
 * Logger un changement de rôle utilisateur
 */
export async function logRoleChange(
  adminUserId: string,
  tenantId: string,
  targetUserId: string,
  oldRole: string,
  newRole: string
): Promise<void> {
  await logAudit({
    userId: adminUserId,
    tenantId,
    action: AuditAction.UPDATE_USER_ROLE,
    entity: AuditEntity.USER,
    entityId: targetUserId,
    changes: {
      before: { role: oldRole },
      after: { role: newRole },
    },
    metadata: {
      targetUserId,
      roleChange: `${oldRole} → ${newRole}`,
    },
  });
}

/**
 * Logger un export de données
 */
export async function logExport(
  userId: string,
  tenantId: string,
  exportType: string,
  filters?: Record<string, unknown>
): Promise<void> {
  await logAudit({
    userId,
    tenantId,
    action: AuditAction.EXPORT_DATA,
    entity: AuditEntity.FMPA, // ou autre selon le type
    metadata: {
      exportType,
      filters,
    },
  });
}

/**
 * Logger une tentative de connexion échouée
 */
export async function logFailedLogin(
  email: string,
  tenantSlug?: string
): Promise<void> {
  try {
    const headersList = headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
      headersList.get("x-real-ip") ||
      "unknown";

    await prisma.auditLog.create({
      data: {
        userId: null,
        tenantId: null,
        action: AuditAction.FAILED_LOGIN,
        entity: AuditEntity.USER,
        metadata: {
          email,
          tenantSlug,
          ipAddress,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'audit failed login:", error);
  }
}

/**
 * Récupérer les logs d'audit pour un utilisateur
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 50
): Promise<Awaited<ReturnType<typeof prisma.auditLog.findMany>>> {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Récupérer les logs d'audit pour un tenant
 */
export async function getTenantAuditLogs(
  tenantId: string,
  limit: number = 100
): Promise<Awaited<ReturnType<typeof prisma.auditLog.findMany>>> {
  return prisma.auditLog.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Récupérer les logs d'audit pour une entité spécifique
 */
export async function getEntityAuditLogs(
  entity: AuditEntity,
  entityId: string,
  limit: number = 50
): Promise<Awaited<ReturnType<typeof prisma.auditLog.findMany>>> {
  return prisma.auditLog.findMany({
    where: {
      entity,
      entityId,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Nettoyer les anciens logs (RGPD - conservation limitée)
 */
export async function cleanOldAuditLogs(
  daysToKeep: number = 365
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}
