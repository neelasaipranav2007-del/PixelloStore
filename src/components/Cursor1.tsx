'use client';

import React, { useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Cursor } from '@/components/core/cursor';
import { AnimatePresence, motion } from 'motion/react';
import { PlusIcon, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Cursor1Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  badge?: string;
  description?: string;
}

// Default real PixelloStore products from the database
export const DEFAULT_PIXELLO_FEATURED_PRODUCTS: Cursor1Product[] = [
  {
    id: 'PRD-01',
    name: 'Premium Wooden Frame',
    price: 149,
    originalPrice: 249,
    image: '/images/wooden_frame_main.png',
    category: 'Frames',
    badge: 'Best Seller',
    description: 'Handcrafted solid wood frame with crystal-clear protective glass.',
  },
  {
    id: 'PRD-02',
    name: 'Classic Custom Polaroid Set (24 prints)',
    price: 8,
    originalPrice: 15,
    image: '/images/polaroid_set.png',
    category: 'Polaroids',
    badge: 'Popular',
    description: 'Vintage glossy mini-prints to preserve your precious memories.',
  },
  {
    id: 'PRD-04',
    name: 'LED Acrylic Photo Lamp',
    price: 1299,
    originalPrice: 1799,
    image: '/images/led_acrylic_lamp.png',
    category: 'LED Frames',
    badge: 'Trending',
    description: 'Warm glowing personalized laser-engraved acrylic ambient light.',
  },
];

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getServerReducedMotionSnapshot() {
  return false;
}

export interface Cursor1Props {
  product?: Cursor1Product;
  products?: Cursor1Product[];
  hoverText?: string;
  className?: string;
  title?: string;
  subtitle?: string;
}

export function Cursor1({
  product,
  products,
  hoverText = 'View Product',
  className,
  title = 'Handcrafted Memories Collection',
  subtitle = 'Hover over any featured product to explore custom framing & printing options',
}: Cursor1Props) {
  const router = useRouter();
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const targetRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot
  );

  const displayProducts = products || (product ? [product] : DEFAULT_PIXELLO_FEATURED_PRODUCTS);

  const handlePositionChange = (x: number, y: number) => {
    let activeId: string | null = null;
    targetRefs.current.forEach((element, id) => {
      if (element) {
        const rect = element.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          activeId = id;
        }
      }
    });
    setHoveredProductId(activeId);
  };

  const isHovering = Boolean(hoveredProductId);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full rounded-3xl bg-gradient-to-b from-[#FFFDFB] via-[#FFF9F5] to-[#F8F3EE] p-6 sm:p-8 md:p-10 border border-[#EFE6DD] shadow-sm select-none',
        'dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 dark:border-zinc-800',
        className
      )}
    >
      {/* Animated Motion Cursor (Active within this interactive section) */}
      {!prefersReducedMotion && (
        <Cursor
          attachToParent
          variants={{
            initial: { scale: 0.3, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
            exit: { scale: 0.3, opacity: 0 },
          }}
          springConfig={{
            bounce: 0.001,
          }}
          transition={{
            ease: 'easeInOut',
            duration: 0.15,
          }}
          onPositionChange={handlePositionChange}
        >
          <motion.div
            animate={{
              width: isHovering ? 136 : 16,
              height: isHovering ? 36 : 16,
            }}
            transition={{
              type: 'spring',
              stiffness: 350,
              damping: 25,
            }}
            className={cn(
              'flex items-center justify-center rounded-[24px] shadow-lg transition-colors duration-200',
              isHovering
                ? 'bg-[#D89A86]/95 backdrop-blur-md text-white border border-white/40 shadow-[0_8px_25px_rgba(216,154,134,0.5)]'
                : 'bg-[#D89A86]/70 backdrop-blur-xs border border-white/40'
            )}
          >
            <AnimatePresence>
              {isHovering ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.15 }}
                  className="inline-flex w-full items-center justify-center px-3"
                >
                  <span className="inline-flex items-center text-xs font-bold text-white whitespace-nowrap">
                    {hoverText} <PlusIcon className="ml-1 h-3.5 w-3.5" />
                  </span>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </Cursor>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D89A86]/15 px-3 py-1 text-xs font-extrabold text-[#D89A86] border border-[#D89A86]/30 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Curated Highlights
          </span>
          <h2 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#3A2B24] dark:text-zinc-100">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-[#6C5C54] dark:text-zinc-400 mt-1 max-w-xl">
            {subtitle}
          </p>
        </div>

        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#D89A86] hover:text-[#3A2B24] transition-colors"
        >
          <span>View All Products</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Interactive Products Grid */}
      <div
        className={cn(
          'grid gap-6',
          displayProducts.length === 1
            ? 'grid-cols-1 max-w-sm mx-auto'
            : displayProducts.length === 2
            ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        )}
      >
        {displayProducts.map((p) => {
          const isTargetHovered = hoveredProductId === p.id;

          return (
            <div
              key={p.id}
              ref={(el) => {
                if (el) {
                  targetRefs.current.set(p.id, el);
                } else {
                  targetRefs.current.delete(p.id);
                }
              }}
              className="group flex flex-col justify-between rounded-3xl border border-[#EFE6DD] bg-white p-4 transition-all duration-300 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
            >
              {/* Product Image Link Container */}
              <Link
                href={`/product/${p.id}`}
                aria-label={`View ${p.name}`}
                className="relative block aspect-square w-full overflow-hidden rounded-2xl bg-[#FFF8F2] outline-none focus-visible:ring-2 focus-visible:ring-[#D89A86]"
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className={cn(
                    'h-full w-full object-cover transition-transform duration-500 ease-out',
                    isTargetHovered && 'scale-105'
                  )}
                />

                {p.badge && (
                  <span className="absolute top-3 left-3 rounded-full bg-[#D89A86] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs">
                    {p.badge}
                  </span>
                )}

                <span className="absolute bottom-3 right-3 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white shadow-xs flex items-center gap-1">
                  {p.category}
                </span>
              </Link>

              {/* Product Info & Action */}
              <div className="pt-4 flex flex-col justify-between flex-1">
                <div>
                  <Link
                    href={`/product/${p.id}`}
                    className="block font-serif-brand text-base font-bold text-[#3A2B24] hover:text-[#D89A86] transition-colors dark:text-zinc-100"
                  >
                    {p.name}
                  </Link>

                  {p.description && (
                    <p className="mt-1 text-xs text-[#6C5C54] dark:text-zinc-400 line-clamp-2">
                      {p.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#EFE6DD] pt-3 dark:border-zinc-800">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-extrabold text-[#3A2B24] dark:text-zinc-100">
                      ₹{p.price}
                    </span>
                    {p.originalPrice && p.originalPrice > p.price && (
                      <span className="text-xs text-[#8C7A70] line-through">
                        ₹{p.originalPrice}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(`/product/${p.id}`);
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-[#D89A86] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#C58572] transition-colors shadow-2xs cursor-pointer"
                  >
                    <span>Customize</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Cursor1;
