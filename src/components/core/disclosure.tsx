'use client';

import * as React from 'react';
import {
  motion,
  AnimatePresence,
  Transition,
  Variant,
} from 'motion/react';
import { cn } from '@/lib/utils';

export type DisclosureContextType = {
  open: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
  contentId: string;
};

const DisclosureContext = React.createContext<DisclosureContextType | null>(null);

export function useDisclosure(): DisclosureContextType {
  const context = React.useContext(DisclosureContext);
  if (!context) {
    throw new Error('Disclosure sub-components must be wrapped within a <Disclosure>');
  }
  return context;
}

export type DisclosureProps = {
  children: React.ReactNode;
  className?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  transition?: Transition;
  variants?: {
    expanded: Variant;
    collapsed: Variant;
  };
};

export function Disclosure({
  children,
  className,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
}: DisclosureProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const contentId = React.useId();

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(value);
      }
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange]
  );

  const toggle = React.useCallback(() => {
    setOpen(!open);
  }, [open, setOpen]);

  const value = React.useMemo(
    () => ({ open, toggle, setOpen, contentId }),
    [open, toggle, setOpen, contentId]
  );

  return (
    <DisclosureContext.Provider value={value}>
      <div className={className}>{children}</div>
    </DisclosureContext.Provider>
  );
}

export type DisclosureTriggerProps = {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
} & Omit<React.ComponentPropsWithoutRef<'button'>, 'onClick'>;

export function DisclosureTrigger({
  children,
  className,
  disabled = false,
  onClick,
  ...props
}: DisclosureTriggerProps) {
  const { open, toggle, contentId } = useDisclosure();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    onClick?.(e);
    if (!e.defaultPrevented) {
      toggle();
    }
  };

  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={contentId}
      disabled={disabled}
      onClick={handleClick}
      className={cn('cursor-pointer focus-visible:outline-none', className)}
      {...props}
    >
      {children}
    </button>
  );
}

export type DisclosureContentProps = {
  children: React.ReactNode;
  className?: string;
  transition?: Transition;
};

export function DisclosureContent({
  children,
  className,
  transition = {
    type: 'spring',
    stiffness: 260,
    damping: 26,
    mass: 0.8,
  },
}: DisclosureContentProps) {
  const { open, contentId } = useDisclosure();

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          id={contentId}
          initial={{ height: 0, opacity: 0, filter: 'blur(3px)' }}
          animate={{ height: 'auto', opacity: 1, filter: 'blur(0px)' }}
          exit={{ height: 0, opacity: 0, filter: 'blur(3px)' }}
          transition={transition}
          className={cn('overflow-hidden', className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Disclosure;
