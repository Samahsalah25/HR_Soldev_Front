import { base44 } from "@/api/base44Client";

/**
 * Write an audit log entry for permission changes.
 */
export async function logPermissionChange({ changeType, targetUserId, targetUserName, targetRole, oldValue, newValue, description }) {
  try {
    const me = await base44.auth.me();
    await base44.entities.PermissionAuditLog.create({
      changed_by_email: me?.email || "unknown",
      changed_by_name:  me?.full_name || me?.email || "unknown",
      change_type:      changeType,
      target_user_id:   targetUserId  || "",
      target_user_name: targetUserName || "",
      target_role:      targetRole     || "",
      old_value:        oldValue  ? JSON.stringify(oldValue)  : "",
      new_value:        newValue  ? JSON.stringify(newValue)  : "",
      description,
    });
  } catch (e) {
    console.error("Audit log error:", e);
  }
}