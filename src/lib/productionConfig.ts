/**
 * PixelloStore - Production Workflow Configuration
 * 
 * Defines whether the production workflow is managed internally by Pixello founders/internal team
 * or via external partner photo studios.
 * 
 * Default: "INTERNAL" (Founders handle processing, printing, product prep, quality check & packing)
 * Future: "STUDIO" (External partner studio network integration)
 */

export type ProductionMode = "INTERNAL" | "STUDIO";

export function getProductionMode(): ProductionMode {
  const mode = process.env.PRODUCTION_MODE || process.env.NEXT_PUBLIC_PRODUCTION_MODE;
  if (mode === "STUDIO") {
    return "STUDIO";
  }
  return "INTERNAL";
}

export function isInternalProduction(): boolean {
  return getProductionMode() === "INTERNAL";
}
