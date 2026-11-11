"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import VisualMemoryFrameStudio from "@/components/customer/VisualMemoryFrameStudio";

function FramesPageInner() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId") || "PRD-01";

  return <VisualMemoryFrameStudio productId={productId} />;
}

export default function FramesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FFFBF7] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#D89A86]" />
        </div>
      }
    >
      <FramesPageInner />
    </Suspense>
  );
}
