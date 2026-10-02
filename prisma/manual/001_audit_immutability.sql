-- HotelsVendors production control: AuditLog is append-only.
-- Apply once against the production Neon database; do not run through Prisma Migrate,
-- because the live database contains out-of-band migrations whose original checksums
-- are not present in this repository.
CREATE OR REPLACE FUNCTION hv_reject_audit_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog is append-only: % is forbidden', TG_OP;
END;
$$;
DROP TRIGGER IF EXISTS hv_audit_log_immutable ON "AuditLog";
CREATE TRIGGER hv_audit_log_immutable
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION hv_reject_audit_mutation();
