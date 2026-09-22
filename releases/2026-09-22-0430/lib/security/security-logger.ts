/**
 * Security Event Logger — OWASP A09:2021 Security Logging & Monitoring Failures
 * Records security-relevant events to stdout (collected by PM2 / nginx / journald).
 *
 * For production, integrate with:
 *   - SIEM (Splunk, Datadog, CloudWatch Logs)
 *   - Webhook alerting (Slack, PagerDuty)
 *   - Audit database table (immutable, append-only)
 */

export type SecurityEventType =
  | "auth_failure"
  | "auth_success"
  | "rate_limit_exceeded"
  | "rbac_denied"
  | "tenant_isolation_breach"
  | "suspicious_input"
  | "admin_override"
  | "mfa_required"
  | "session_invalid"
  | "unauthorized_access_attempt";

interface SecurityEvent {
  timestamp: string;
  event: SecurityEventType;
  severity: "info" | "warning" | "critical";
  ip?: string;
  userId?: string;
  tenantId?: string;
  path?: string;
  method?: string;
  details?: Record<string, unknown>;
  userAgent?: string;
}

function sanitizeDetail(key: string, value: unknown): unknown {
  // Never log passwords, tokens, or secrets
  const sensitiveKeys = [
    "password",
    "token",
    "secret",
    "apiKey",
    "api_key",
    "authorization",
    "credit_card",
    "cvv",
    "ssn",
    "nationalId",
  ];
  const lowerKey = key.toLowerCase();
  if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
    return "[REDACTED]";
  }
  return value;
}

export function logSecurityEvent(event: Omit<SecurityEvent, "timestamp">): void {
  const sanitizedDetails = event.details
    ? Object.fromEntries(
        Object.entries(event.details).map(([k, v]) => [k, sanitizeDetail(k, v)])
      )
    : undefined;

  const payload: SecurityEvent = {
    timestamp: new Date().toISOString(),
    ...event,
    details: sanitizedDetails,
  };

  // In production, this should write to:
  //   - Immutable audit log table (append-only, no UPDATE/DELETE)
  //   - Structured log aggregator (JSON Lines)
  //   - Alerting webhook for critical events

  const logLine = JSON.stringify(payload);

  if (event.severity === "critical") {
    console.error(`[SECURITY-CRITICAL] ${logLine}`);
  } else if (event.severity === "warning") {
    console.warn(`[SECURITY-WARN] ${logLine}`);
  } else {
    console.log(`[SECURITY-INFO] ${logLine}`);
  }
}

/**
 * Convenience wrappers for common events.
 */

export function logAuthFailure(
  ip: string,
  path: string,
  reason: string,
  userId?: string
): void {
  logSecurityEvent({
    event: "auth_failure",
    severity: "warning",
    ip,
    userId,
    path,
    method: "POST",
    details: { reason },
  });
}

export function logRateLimit(ip: string, path: string, tier: string): void {
  logSecurityEvent({
    event: "rate_limit_exceeded",
    severity: "warning",
    ip,
    path,
    details: { tier },
  });
}

export function logRbacDenied(
  ip: string,
  userId: string,
  path: string,
  requiredPermission: string,
  actualRole?: string
): void {
  logSecurityEvent({
    event: "rbac_denied",
    severity: "critical",
    ip,
    userId,
    path,
    details: { requiredPermission, actualRole },
  });
}

export function logTenantBreach(
  ip: string,
  userId: string,
  attemptedTenantId: string,
  actualTenantId: string
): void {
  logSecurityEvent({
    event: "tenant_isolation_breach",
    severity: "critical",
    ip,
    userId,
    details: { attemptedTenantId, actualTenantId },
  });
}

export function logAdminOverride(
  adminUserId: string,
  targetEntity: string,
  reason: string
): void {
  logSecurityEvent({
    event: "admin_override",
    severity: "critical",
    userId: adminUserId,
    details: { targetEntity, reason },
  });
}
