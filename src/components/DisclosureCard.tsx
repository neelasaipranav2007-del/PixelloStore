'use client';

import React, { useState, useRef, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ChevronDown,
  ShoppingCart,
  Eye,
  Sparkles,
  Check,
  Heart,
  Star,
  ShieldCheck,
} from 'lucide-react';
import {
  Disclosure,
  DisclosureTrigger,
  DisclosureContent,
} from '@/components/core/disclosure';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { Product } from '@/context/ProductContext';
import { cn } from '@/lib/utils';

export interface DisclosureCardProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  description?: string;
  badge?: string;
  stock?: number;
  rating?: number;
  reviews?: number;
  highlightSpecs?: string[];
}

export interface DisclosureCardProps {
  product: DisclosureCardProduct | Product;
  defaultOpen?: boolean;
  className?: string;
  imageAspectRatio?: 'video' | 'square' | 'portrait';
  onViewProduct?: (productId: string) => void;
  onAddToCart?: (product: DisclosureCardProduct | Product) => void;
}

// Reduced motion listener for accessibility
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

export function DisclosureCard({
  product,
  defaultOpen = false,
  className,
  imageAspectRatio = 'square',
  onViewProduct,
  onAddToCart,
}: DisclosureCardProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [imgSrc, setImgSrc] = useState(product.image || '/images/wooden_frame_main.png');

  const addedTimerRef = useRef<NodeJS.Timeout | null>(null);

  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot
  );

  const isFavorite = isInWishlist(product.id);
  const isOutOfStock = (product.stock !== undefined && product.stock <= 0) || (product as any).status === 'Out of Stock';

  // Custom highlights based on category
  const getProductHighlights = () => {
    const cat = (product.category || '').toLowerCase();
    const name = (product.name || '').toLowerCase();

    if (cat.includes('polaroid') || name.includes('polaroid')) {
      return ['Glossy HD Mini-Print', 'Archival Photo Paper', 'Scratch-Proof'];
    }
    if (cat.includes('frame') || name.includes('frame')) {
      return ['Handcrafted Solid Wood', 'Ultra-Clear Acrylic', 'Wall & Desk Mount'];
    }
    if (cat.includes('led') || name.includes('led') || cat.includes('lamp')) {
      return ['Warm Ambient Glow', 'Laser-Etched Acrylic', 'USB Powered'];
    }
    if (name.includes('keychain') || name.includes('key chain')) {
      return ['Double-Sided HD Print', 'Stainless Keyring', 'Pocket Keepsake'];
    }
    return ['Master Craftsmanship', 'Vibrant Color Match', 'Locally Printed'];
  };

  const highlights = getProductHighlights();

  const handleOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAddingToCart || isOutOfStock) return;
    setIsAddingToCart(true);

    try {
      if (onAddToCart) {
        onAddToCart(product);
      } else {
        await addToCart({
          id: product.id,
          name: product.name,
          size: 'Standard',
          price: product.price,
          quantity: 1,
          image: imgSrc,
        });
      }

      setJustAdded(true);
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
      addedTimerRef.current = setTimeout(() => {
        setJustAdded(false);
      }, 2500);
    } catch (err) {
      console.error('Error adding to cart:', err);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleViewProduct = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onViewProduct) {
      onViewProduct(product.id);
    } else {
      router.push(`/product/${product.id}`);
    }
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      image: imgSrc,
    });
  };

  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-3xl border border-[#EFE6DD] bg-white transition-all duration-300 shadow-xs hover:shadow-lg',
        'dark:border-zinc-800 dark:bg-zinc-900',
        isOpen && 'ring-2 ring-[#D89A86]/40 border-[#F2C8B5] dark:ring-[#D89A86]/30',
        className
      )}
    >
      <Disclosure open={isOpen} onOpenChange={handleOpenChange}>
        {/* ============================================================== */}
        {/* 1. PRODUCT IMAGE CONTAINER WITH SUBTLE ZOOM & BLUR ANIMATION */}
        {/* ============================================================== */}
        <div
          role="button"
          tabIndex={0}
          aria-label={`${isOpen ? 'Collapse' : 'Expand'} details for ${product.name}`}
          onClick={() => setIsOpen((prev) => !prev)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen((prev) => !prev);
            }
          }}
          className={cn(
            'relative w-full overflow-hidden rounded-t-3xl cursor-pointer bg-[#FFF8F2] dark:bg-zinc-800 select-none',
            imageAspectRatio === 'square' && 'aspect-square',
            imageAspectRatio === 'video' && 'aspect-video',
            imageAspectRatio === 'portrait' && 'aspect-[4/5]'
          )}
        >
          {/* Animated Product Image */}
          <motion.img
            src={imgSrc}
            alt={product.name}
            onError={() => setImgSrc('/images/wooden_frame_main.png')}
            animate={{
              scale: prefersReducedMotion ? 1 : isOpen ? 1.05 : 1,
              filter: prefersReducedMotion
                ? 'none'
                : isOpen
                ? 'blur(1px)'
                : 'blur(0px)',
            }}
            transition={{
              type: 'spring',
              stiffness: 220,
              damping: 24,
            }}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-102"
          />

          {/* Ambient Top & Bottom Gradients for Contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

          {/* Category Badge & Availability Pill */}
          <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10 pointer-events-none">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#3A2B24] shadow-xs dark:bg-zinc-900/90 dark:text-zinc-100">
              <Sparkles className="h-3 w-3 text-[#D89A86]" />
              {product.category || 'Handcrafted'}
            </span>

            {product.badge && (
              <span className="inline-flex items-center rounded-full bg-[#D89A86] px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
                {product.badge}
              </span>
            )}

            {isOutOfStock && (
              <span className="inline-flex items-center rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                Out of Stock
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={handleWishlistToggle}
            aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
            className={cn(
              'absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md transition-all shadow-xs hover:scale-110 active:scale-95 cursor-pointer dark:bg-zinc-900/90',
              isFavorite ? 'text-rose-600' : 'text-[#6C5C54] hover:text-rose-500 dark:text-zinc-300'
            )}
          >
            <Heart className={cn('h-4 w-4', isFavorite && 'fill-rose-600')} />
          </button>

          {/* Floating Price Pill (Visible over image on mobile/collapsed) */}
          <div className="absolute bottom-3 right-3 z-10 rounded-full bg-black/70 backdrop-blur-md px-3 py-1 text-white shadow-xs pointer-events-none">
            <span className="text-xs font-black tracking-wide">₹{product.price}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="ml-1 text-[10px] text-[#EFE6DD] line-through opacity-70">
                ₹{product.originalPrice}
              </span>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. DISCLOSURE TRIGGER (COMPACT PRODUCT TITLE & TOGGLE ARROW) */}
        {/* ============================================================== */}
        <div className="p-4 sm:p-5">
          <DisclosureTrigger
            className="flex w-full items-center justify-between text-left group/trigger cursor-pointer"
            aria-label={`Toggle details for ${product.name}`}
          >
            <div className="space-y-0.5 pr-2 min-w-0">
              <h3 className="font-serif-brand text-base sm:text-lg font-bold text-[#3A2B24] truncate group-hover/trigger:text-[#D89A86] transition-colors dark:text-zinc-100 dark:group-hover/trigger:text-[#D89A86]">
                {product.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-[#6C5C54] dark:text-zinc-400">
                <span className="font-bold text-[#D89A86]">₹{product.price}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                  {product.rating || 4.9}
                </span>
                <span>•</span>
                <span className="text-[11px] text-[#6C5C54] dark:text-zinc-400">
                  {isOpen ? 'Tap to collapse' : 'Tap to reveal details'}
                </span>
              </div>
            </div>

            {/* Rotating Arrow Indicator */}
            <motion.div
              animate={{ rotate: prefersReducedMotion ? 0 : isOpen ? 180 : 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#EFE6DD] bg-[#FFF8F2] text-[#3A2B24] shadow-2xs transition-colors group-hover/trigger:border-[#D89A86] group-hover/trigger:bg-white',
                'dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
              )}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </DisclosureTrigger>

          {/* ============================================================== */}
          {/* 3. DISCLOSURE CONTENT (EXPANDABLE DETAILS & ACTION BUTTONS) */}
          {/* ============================================================== */}
          <DisclosureContent className="pt-3">
            <div className="space-y-3.5 border-t border-[#EFE6DD]/70 pt-3 dark:border-zinc-800">
              {/* Product Short Description */}
              <p className="text-xs text-[#6C5C54] leading-relaxed dark:text-zinc-300">
                {product.description ||
                  'Premium personalized keepsake crafted with photographic-grade clarity and long-lasting materials.'}
              </p>

              {/* Craftsmanship Highlights / Tags */}
              <div className="flex flex-wrap gap-1.5">
                {highlights.map((spec, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-md bg-[#FFF8F2] px-2 py-0.5 text-[10px] font-semibold text-[#6C5C54] border border-[#EFE6DD] dark:bg-zinc-800/80 dark:border-zinc-700 dark:text-zinc-300"
                  >
                    <Check className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                    {spec}
                  </span>
                ))}
              </div>

              {/* Availability & Dispatch Notice */}
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#6C5C54] dark:text-zinc-400 pt-0.5">
                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  {isOutOfStock ? 'Temporarily Sold Out' : 'Ready to Dispatch • Local Studio'}
                </span>
                <span className="font-mono text-[#D89A86] font-extrabold">
                  {product.originalPrice && product.originalPrice > product.price
                    ? `Save ₹${product.originalPrice - product.price}`
                    : 'Best Value'}
                </span>
              </div>

              {/* Interactive Functional Buttons: View Product + Shop Now */}
              <div className="flex items-center gap-2 pt-1">
                {/* View Product Button */}
                <button
                  type="button"
                  onClick={handleViewProduct}
                  className={cn(
                    'flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-[#D89A86]/60 bg-white px-3.5 py-2.5 text-xs font-bold text-[#3A2B24] transition-all hover:bg-[#FFF8F2] hover:border-[#D89A86] active:scale-95 cursor-pointer shadow-2xs',
                    'dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-700'
                  )}
                >
                  <Eye className="h-3.5 w-3.5 text-[#D89A86]" />
                  <span>Customize</span>
                </button>

                {/* Shop Now / Add to Cart Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || isOutOfStock}
                  className={cn(
                    'flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer',
                    justAdded
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-[#D89A86] text-white hover:bg-[#C58572] active:scale-95',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D89A86] focus-visible:ring-offset-2'
                  )}
                >
                  {isAddingToCart ? (
                    <span>Adding...</span>
                  ) : justAdded ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-white" />
                      <span>Added! ✓</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-3.5 w-3.5" />
                      <span>Shop Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </DisclosureContent>
        </div>
      </Disclosure>
    </div>
  );
}

export default DisclosureCard;
export { DisclosureCardGrid } from './DisclosureCardGrid';

