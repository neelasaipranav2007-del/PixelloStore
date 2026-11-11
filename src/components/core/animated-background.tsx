'use client';

import React, {
  Children,
  cloneElement,
  ReactElement,
  useState,
  useId,
} from 'react';
import { AnimatePresence, Transition, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ChildItemProps {
  'data-id'?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  className?: string;
  [key: string]: unknown;
}

export type AnimatedBackgroundProps = {
  children:
    | ReactElement<ChildItemProps>[]
    | ReactElement<ChildItemProps>;
  defaultValue?: string;
  value?: string;
  onValueChange?: (newActiveId: string | null) => void;
  className?: string;
  transition?: Transition;
  enableHover?: boolean;
};

export function AnimatedBackground({
  children,
  defaultValue,
  value,
  onValueChange,
  className,
  transition,
  enableHover = false,
}: AnimatedBackgroundProps) {
  const [internalActiveId, setInternalActiveId] = useState<string | null>(
    defaultValue ?? null
  );
  const [prevDefaultValue, setPrevDefaultValue] = useState(defaultValue);

  if (defaultValue !== prevDefaultValue) {
    setPrevDefaultValue(defaultValue);
    if (value === undefined) {
      setInternalActiveId(defaultValue ?? null);
    }
  }

  const activeId = value !== undefined ? value : internalActiveId;
  const uniqueId = useId();

  const handleSetActiveId = (id: string | null) => {
    if (value === undefined) {
      setInternalActiveId(id);
    }
    if (onValueChange) {
      onValueChange(id);
    }
  };

  return Children.map(children, (child, index) => {
    if (!child || !React.isValidElement<ChildItemProps>(child)) return null;
    const id = child.props['data-id'];

    const interactionProps = enableHover
      ? {
          onMouseEnter: () => handleSetActiveId(id ?? null),
          onMouseLeave: () => handleSetActiveId(null),
        }
      : {
          onClick: (e: React.MouseEvent<HTMLElement>) => {
            handleSetActiveId(id ?? null);
            if (child.props.onClick) {
              child.props.onClick(e);
            }
          },
        };

    return (
      <div
        key={index}
        data-id={id}
        className="relative inline-flex items-center justify-center"
      >
        <AnimatePresence>
          {activeId !== null && activeId !== undefined && activeId === id && (
            <motion.div
              layoutId={`animated-background-${uniqueId}`}
              className={cn('absolute inset-0 rounded-full', className)}
              transition={
                transition ?? {
                  type: 'spring',
                  bounce: 0.2,
                  duration: 0.3,
                }
              }
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
        <div className="z-10 relative">{cloneElement(child, interactionProps)}</div>
      </div>
    );
  });
}
