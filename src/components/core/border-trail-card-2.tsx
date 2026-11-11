'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { BorderTrail } from '@/components/core/border-trail';

export interface BorderTrailCard2Props extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  trailClassName?: string;
  trailSize?: number;
  glowColor?: 'pink' | 'green' | 'amber';
  active?: boolean;
  duration?: number;
  repeat?: number | typeof Infinity;
  onAction?: () => Promise<void> | void;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  actionDisabled?: boolean;
  showDefaultAction?: boolean;
  children?: React.ReactNode;
}

const GLOW_CLASSES = {
  pink: 'bg-gradient-to-r from-[#F8D2C2] via-[#D89A86] to-[#F8D2C2] shadow-[0_0_12px_rgba(216,154,134,0.6)] dark:from-[#9D5947] dark:via-[#D89A86] dark:to-[#9D5947]',
  green: 'bg-gradient-to-r from-emerald-300 via-emerald-500 to-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.5)] dark:from-emerald-700 dark:via-emerald-500 dark:to-emerald-700',
  amber: 'bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)] dark:from-amber-700 dark:via-amber-500 dark:to-amber-700',
};

export function BorderTrailCard2({
  className,
  trailClassName,
  trailSize = 100,
  glowColor = 'pink',
  active = true,
  duration = 4,
  repeat = Infinity,
  onAction,
  actionLabel = 'View Offer',
  actionIcon,
  actionDisabled = false,
  showDefaultAction = false,
  children,
  ...props
}: BorderTrailCard2Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [prevActive, setPrevActive] = useState(active);
  const [isActionActive, setIsActionActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  if (active !== prevActive) {
    setPrevActive(active);
    setIsActionActive(false);
  }

  const isTrailVisible = active || isActionActive;

  // Clean up any pending timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleAction = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (isProcessing || actionDisabled || !onAction) return;

    setIsProcessing(true);
    setIsActionActive(true);

    try {
      await onAction();
    } catch (err) {
      console.error('BorderTrailCard2 action error:', err);
    } finally {
      setIsProcessing(false);
      if (!active) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setIsActionActive(false);
        }, 1200);
      }
    }
  }, [actionDisabled, active, isProcessing, onAction]);

  return (
    <div
      className={cn(
        'relative rounded-3xl border border-[#EFE6DD] bg-white transition-all overflow-hidden p-6',
        'dark:border-zinc-800 dark:bg-zinc-900',
        className
      )}
      {...props}
    >
      {isTrailVisible && (
        <BorderTrail
          className={cn(
            GLOW_CLASSES[glowColor],
            'transition-opacity duration-300',
            trailClassName
          )}
          size={trailSize}
          transition={{
            ease: [0, 0.5, 0.8, 0.5],
            duration: duration,
            repeat: repeat,
          }}
        />
      )}

      <div className="relative z-10 flex flex-col justify-between h-full">
        {children}

        {showDefaultAction && onAction && (
          <div className="mt-4 flex items-center justify-end">
            <button
              type="button"
              onClick={handleAction}
              disabled={isProcessing || actionDisabled}
              aria-label={actionLabel}
              className={cn(
                'inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer',
                'bg-[#D89A86] text-white hover:bg-[#C58572] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D89A86] focus-visible:ring-offset-2'
              )}
            >
              {actionIcon}
              <span>{isProcessing ? 'Processing...' : actionLabel}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default BorderTrailCard2;
