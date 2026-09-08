/**
 * PixelloStore - Studio Portal Master Feature Flag Utility
 * Controls temporary closure and reopening of the Studio Portal.
 * 
 * Configured via .env.local:
 * STUDIO_PORTAL_ENABLED=false (or true)
 * NEXT_PUBLIC_STUDIO_PORTAL_ENABLED=false (or true)
 */

export function isStudioPortalEnabled(): boolean {
  const publicFlag = process.env.NEXT_PUBLIC_STUDIO_PORTAL_ENABLED;
  const serverFlag = process.env.STUDIO_PORTAL_ENABLED;

  const val = (publicFlag && publicFlag.trim() !== "") ? publicFlag : serverFlag;

  if (val !== undefined && val !== null && String(val).trim().toLowerCase() === "false") {
    return false;
  }

  return true;
}
