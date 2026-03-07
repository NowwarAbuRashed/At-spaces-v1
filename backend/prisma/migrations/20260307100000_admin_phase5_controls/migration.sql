-- Extend security event enum with Phase 5 admin actions.
ALTER TYPE "SecurityEventType" ADD VALUE IF NOT EXISTS 'approval_reviewed';
ALTER TYPE "SecurityEventType" ADD VALUE IF NOT EXISTS 'branch_status_changed';
ALTER TYPE "SecurityEventType" ADD VALUE IF NOT EXISTS 'vendor_status_changed';
ALTER TYPE "SecurityEventType" ADD VALUE IF NOT EXISTS 'report_exported';

-- Enforce append-only behavior for audit_log.
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_append_only ON "audit_log";
CREATE TRIGGER audit_log_append_only
BEFORE UPDATE OR DELETE ON "audit_log"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_mutation();
