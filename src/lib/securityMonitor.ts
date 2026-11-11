import { logAudit } from "@/lib/auditLogger";

interface SecurityEvent {
  identifier: string;
  type: string;
  timestamp: number;
}

const failedAttempts = new Map<string, number[]>();
const SUSPICIOUS_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_FAILED_ATTEMPTS = 5;

/**
 * Records a failed security action (failed login, invalid pin, signature mismatch)
 * Returns { isSuspicious: boolean, attempts: number, lockTimeSec: number }
 */
export function recordSecurityFailure(
  identifier: string,
  eventType: string,
  req?: Request
): { isSuspicious: boolean; attempts: number; lockTimeSec: number } {
  const key = `${eventType}:${identifier}`;
  const now = Date.now();
  const history = failedAttempts.get(key) || [];
  const valid = history.filter((t) => now - t < SUSPICIOUS_WINDOW_MS);
  valid.push(now);
  failedAttempts.set(key, valid);

  const count = valid.length;
  const isSuspicious = count >= MAX_FAILED_ATTEMPTS;

  if (isSuspicious) {
    // Record security audit alert
    logAudit({
      action: "SUSPICIOUS_ACTIVITY_ALERT",
      details: {
        eventType,
        identifier: identifier.replace(/.(?=.{4})/g, "*"), // partially mask identifier
        attempts: count,
        windowMinutes: 5,
      },
      req,
    }).catch(() => {});
  }

  const oldest = valid[0];
  const lockTimeSec = Math.max(1, Math.ceil((oldest + SUSPICIOUS_WINDOW_MS - now) / 1000));

  return {
    isSuspicious,
    attempts: count,
    lockTimeSec,
  };
}

/**
 * Clears failures upon successful authentication
 */
export function clearSecurityFailures(identifier: string, eventType: string): void {
  const key = `${eventType}:${identifier}`;
  failedAttempts.delete(key);
}

/**
 * Checks whether an identifier is currently flagged / cooled down
 */
export function isSecurityLocked(
  identifier: string,
  eventType: string
): { locked: boolean; remainingSec: number } {
  const key = `${eventType}:${identifier}`;
  const now = Date.now();
  const history = failedAttempts.get(key) || [];
  const valid = history.filter((t) => now - t < SUSPICIOUS_WINDOW_MS);

  if (valid.length >= MAX_FAILED_ATTEMPTS) {
    const oldest = valid[0];
    const remainingSec = Math.max(1, Math.ceil((oldest + SUSPICIOUS_WINDOW_MS - now) / 1000));
    return { locked: true, remainingSec };
  }

  return { locked: false, remainingSec: 0 };
}
