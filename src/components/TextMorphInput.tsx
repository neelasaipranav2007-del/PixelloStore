'use client';

import React, { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Wand2, RotateCcw } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { TextMorph } from '@/components/core/text-morph';
import { cn } from '@/lib/utils';

export const PIXELLO_DEFAULT_WORDS = [
  'Capture',
  'Create',
  'Cherish',
  'Memories',
  'Gifting',
];

const emptySubscribe = () => () => {};

function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export interface TextMorphInputProps {
  /** Mode: 'auto' (automatic cycle), 'interactive' (editable input only), or 'both' (auto cycle with live input) */
  mode?: 'auto' | 'interactive' | 'both';
  /** Words to cycle through in auto mode */
  words?: string[];
  /** Default or initial word */
  defaultWord?: string;
  /** Heading above the morphing text */
  heading?: string;
  /** Subtitle below the morphing text */
  subtitle?: string;
  /** Interval in ms for automatic rotation (default: 3200ms) */
  interval?: number;
  /** ClassName for the outer container */
  className?: string;
  /** Whether to show the action buttons */
  showButtons?: boolean;
  /** Primary button destination (default: '/products') */
  exploreHref?: string;
  /** Primary button label (default: 'Explore Gifts') */
  exploreLabel?: string;
  /** Secondary button destination */
  secondaryHref?: string;
  /** Secondary button label */
  secondaryLabel?: string;
  /** Placeholder for interactive input */
  inputPlaceholder?: string;
}

export function TextMorphInput({
  mode = 'both',
  words = PIXELLO_DEFAULT_WORDS,
  defaultWord,
  heading = 'Every Memory Deserves a Frame',
  subtitle = 'Turn your favourite moments into personalized gifts with PixelloStore.',
  interval = 3200,
  className,
  showButtons = true,
  exploreHref = '/products',
  exploreLabel = 'Explore Gifts',
  secondaryHref = '#campus-ambassador',
  secondaryLabel = 'Become Campus Ambassador',
  inputPlaceholder = 'Type your favorite word or memory...',
}: TextMorphInputProps) {
  const isMounted = useIsMounted();
  const shouldReduceMotion = useReducedMotion();
  const isReducedMotion = isMounted && !!shouldReduceMotion;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputText, setInputText] = useState(defaultWord || words[0] || 'Capture');
  const [isUserTyping, setIsUserTyping] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Advance to next word in the predefined array
  const advanceWord = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % words.length;
      setInputText(words[nextIndex]);
      return nextIndex;
    });
  }, [words]);

  // Handle automatic rotation
  useEffect(() => {
    // If not in auto or both, or if user is currently typing, don't auto-rotate
    if (mode === 'interactive' || isUserTyping || isReducedMotion) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      advanceWord();
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, isUserTyping, isReducedMotion, interval, advanceWord]);

  // Clean up any pending resume timer on unmount
  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // When customer types in the input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);
    setIsUserTyping(true);

    // Pause auto-rotation; resume after 5 seconds of inactivity
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setIsUserTyping(false);
    }, 5000);
  };

  // Quick word pill selection
  const handleSelectWord = (word: string, index: number) => {
    setInputText(word);
    setCurrentIndex(index);
    setIsUserTyping(false);
  };

  const handleResetToAuto = () => {
    setIsUserTyping(false);
    const nextIdx = (currentIndex + 1) % words.length;
    setCurrentIndex(nextIdx);
    setInputText(words[nextIdx]);
  };

  // Text to display in TextMorph: fallback to non-empty space if input is cleared
  const displayText = inputText.trim() || 'Frame';

  return (
    <div
      className={cn(
        'w-full max-w-4xl mx-auto flex flex-col items-center text-center',
        className
      )}
    >
      {/* ============================================================== */}
      {/* 1. TOP BRANDING BADGE */}
      {/* ============================================================== */}
      <motion.div
        initial={isReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#D89A86]/30 bg-[#FFF8F2] px-4 py-1.5 text-xs font-extrabold text-[#D89A86] shadow-2xs dark:bg-zinc-800/80 dark:border-zinc-700"
      >
        <Sparkles className="h-3.5 w-3.5 text-[#D89A86]" />
        <span>Personalized Handcrafted Gifts</span>
      </motion.div>

      {/* ============================================================== */}
      {/* 2. DYNAMIC MORPHING HEADLINE (NO LAYOUT SHIFT) */}
      {/* ============================================================== */}
      <h1 suppressHydrationWarning className="font-serif-brand text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-[#3A2B24] mb-5 leading-[1.15] dark:text-zinc-100">
        <span className="block sm:inline">{heading}</span>{' '}
        <span className="block mt-1 sm:mt-0 sm:inline-block">
          <span suppressHydrationWarning className="inline-flex justify-center items-baseline min-w-[130px] xs:min-w-[170px] sm:min-w-[260px] md:min-w-[320px] text-center italic text-[#D89A86] font-normal underline decoration-[#F2C8B5] underline-offset-8">
            <TextMorph>{displayText}</TextMorph>
          </span>
        </span>
      </h1>

      {/* ============================================================== */}
      {/* 3. SUBTITLE */}
      {/* ============================================================== */}
      <p className="text-base sm:text-lg md:text-xl text-[#6C5C54] mb-8 max-w-2xl leading-relaxed dark:text-zinc-300">
        {subtitle}
      </p>

      {/* ============================================================== */}
      {/* 4. INTERACTIVE INPUT CONTROLS & SUGGESTION PILLS */}
      {/* ============================================================== */}
      {mode !== 'auto' && (
        <motion.div
          initial={isReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full max-w-lg mb-8 space-y-3"
        >
          {/* Real-time editable input pill */}
          <div className="relative flex items-center">
            <label htmlFor="pixello-text-morph-input" className="sr-only">
              Type custom text to morph live
            </label>
            <div className="absolute left-4 text-[#D89A86] pointer-events-none">
              <Wand2 className="h-4 w-4" />
            </div>
            <input
              id="pixello-text-morph-input"
              type="text"
              value={inputText}
              maxLength={24}
              onChange={handleInputChange}
              placeholder={inputPlaceholder}
              autoComplete="off"
              data-1p-ignore="true"
              data-lpignore="true"
              suppressHydrationWarning
              className={cn(
                'w-full h-12 pl-11 pr-24 rounded-full border border-[#EFE6DD] bg-white text-sm font-semibold text-[#3A2B24] shadow-xs',
                'placeholder:text-[#6C5C54]/60 placeholder:font-normal',
                'focus:border-[#D89A86] focus:ring-2 focus:ring-[#D89A86]/20 focus:outline-none transition-all',
                'dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100'
              )}
            />
            {isUserTyping ? (
              <button
                type="button"
                onClick={handleResetToAuto}
                suppressHydrationWarning
                className="absolute right-2 px-3 py-1.5 rounded-full bg-[#FFF8F2] hover:bg-[#F2C8B5]/40 text-[#D89A86] text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-[#EFE6DD] dark:bg-zinc-700 dark:border-zinc-600"
                title="Resume auto rotation"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Auto</span>
              </button>
            ) : (
              <span className="absolute right-4 text-[10px] uppercase tracking-wider font-extrabold text-[#D89A86]/80 pointer-events-none">
                Live
              </span>
            )}
          </div>

          {/* Quick preset word suggestion pills */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-[#6C5C54] mr-1 hidden sm:inline dark:text-zinc-400">
              Suggestions:
            </span>
            {words.map((w, idx) => {
              const isActive = inputText.toLowerCase() === w.toLowerCase();
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => handleSelectWord(w, idx)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border',
                    isActive
                      ? 'bg-[#D89A86] text-white border-[#D89A86] shadow-2xs scale-105'
                      : 'bg-white/80 text-[#6C5C54] hover:bg-[#FFF8F2] hover:text-[#3A2B24] border-[#EFE6DD] dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300'
                  )}
                >
                  {w}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ============================================================== */}
      {/* 5. CALL TO ACTION BUTTONS */}
      {/* ============================================================== */}
      {showButtons && (
        <motion.div
          initial={isReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
        >
          <Link
            href={exploreHref}
            className="btn-pixello-primary text-sm sm:text-base md:text-lg h-12 sm:h-14 px-6 sm:px-9 rounded-full flex items-center justify-center w-full sm:w-auto shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer font-bold"
          >
            <span>{exploreLabel}</span>
            <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
          </Link>

          {secondaryHref && secondaryLabel && (
            <a
              href={secondaryHref}
              className="h-12 sm:h-14 px-6 sm:px-8 text-xs sm:text-base font-semibold rounded-full border-2 border-[#D89A86]/40 text-[#3A2B24] hover:bg-[#FFF8F2] transition-all flex items-center justify-center w-full sm:w-auto cursor-pointer dark:text-zinc-200 dark:hover:bg-zinc-800 dark:border-zinc-700"
            >
              {secondaryLabel}
            </a>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default TextMorphInput;
