import { prisma } from '../prisma';

export interface AuditEntry {
  action: string;
  entity: string;
  entityId: string;
  details?: string;
  userId?: string;
  userName?: string;
  ipAddress?: string;
}

/**
 * Best-effort audit writer.
 * Audit failures must never break the business operation that triggered them.
 */
export async function writeAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        details: entry.details,
        userId: entry.userId,
        userName: entry.userName,
        ipAddress: entry.ipAddress,
      },
    });
  } catch (err: any) {
    console.warn('[Audit] Failed to write audit entry:', err?.message || err);
  }
}
