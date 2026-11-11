'use client';

import * as React from 'react';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from 'motion/react';
import { cn } from '@/lib/utils';

export type TextMorphProps = Omit<
  React.ComponentProps<'span'>,
  'children'
> & {
  children: string | string[];
  /** Overrides the default morph transition. */
  transition?: Transition;
  as?: React.ElementType;
};

const DEFAULT_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 280,
  damping: 26,
  mass: 0.6,
  opacity: {
    duration: 0.25,
    ease: 'easeInOut',
  },
};

const emptySubscribe = () => () => {};

function useIsMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function getText(children: TextMorphProps['children']) {
  return Array.isArray(children) ? children.join('') : children;
}

function generateKeys(text: string) {
  const charCount: Record<string, number> = {};
  // Handle UTF-16 surrogate pairs and emojis accurately
  return Array.from(text).map((char) => {
    charCount[char] = (charCount[char] || 0) + 1;
    const key = `${char}-${charCount[char]}`;
    return { char, key };
  });
}

export function TextMorph({
  children,
  className,
  transition: transitionProp,
  ...props
}: TextMorphProps) {
  const isMounted = useIsMounted();
  const shouldReduceMotion = useReducedMotion();
  const text = getText(children);
  const textToDisplay = React.useMemo(() => generateKeys(text), [text]);

  const isReducedMotion = isMounted && !!shouldReduceMotion;

  const transition = isReducedMotion
    ? { duration: 0 }
    : (transitionProp ?? DEFAULT_TRANSITION);

  // During SSR and initial client hydration, render static standard spans to prevent
  // Next.js Turbopack hydration mismatch between server-rendered HTML and client motion attributes
  if (!isMounted) {
    return (
      <span
        suppressHydrationWarning
        className={cn('inline-block relative select-none', className)}
        {...props}
      >
        <span className="sr-only">{text}</span>
        <span aria-hidden="true" className="inline-flex justify-center items-center">
          {textToDisplay.map(({ char, key }) => (
            <span key={key} suppressHydrationWarning className="inline-block whitespace-pre">
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </span>
      </span>
    );
  }

  return (
    <span
      suppressHydrationWarning
      className={cn('inline-block relative select-none', className)}
      {...props}
    >
      <span className="sr-only">{text}</span>
      <AnimatePresence mode="popLayout" initial={false}>
        <span aria-hidden="true" className="inline-flex justify-center items-center">
          {textToDisplay.map(({ char, key }) => (
            <motion.span
              key={key}
              layoutId={isReducedMotion ? undefined : key}
              layout={!isReducedMotion}
              initial={
                isReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.85, filter: 'blur(2px)' }
              }
              animate={
                isReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 1, scale: 1, filter: 'blur(0px)' }
              }
              exit={
                isReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.85, filter: 'blur(2px)' }
              }
              transition={transition}
              className="inline-block whitespace-pre"
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </span>
      </AnimatePresence>
    </span>
  );
}

export default TextMorph;
