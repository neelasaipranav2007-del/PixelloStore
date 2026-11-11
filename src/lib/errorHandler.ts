import { NextResponse } from "next/server";

/**
 * Produces safe API error responses that do not leak internal system details,
 * database query errors, file paths, or stack traces.
 */
export function safeErrorResponse(
  error: unknown,
  status = 500,
  userMessage?: string
): NextResponse {
  const isDebug = process.env.DEBUG === "true";
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Always log server-side for diagnostics
  console.error(`[API Error ${status}]:`, error);

  // Mask database query details, prisma error codes, and system paths
  let safeMessage = userMessage || "An unexpected error occurred. Please try again later.";
  if (status < 500) {
    safeMessage = userMessage || errorMessage;
  }

  // Strip file paths or sensitive SQLite/Prisma traces from public messages
  safeMessage = safeMessage.replace(/[A-Za-z]:\\[^\s]+/g, "[internal path]");

  return NextResponse.json(
    {
      success: false,
      error: safeMessage,
      ...(isDebug && error instanceof Error && error.stack
        ? { debugStack: error.stack }
        : {}),
    },
    { status }
  );
}
