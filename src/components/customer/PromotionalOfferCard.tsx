'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Sparkles, Copy, Check, ArrowRight, Tag, ShieldCheck } from 'lucide-react';
import { BorderTrailCard2 } from '@/components/core/border-trail-card-2';
import { cn } from '@/lib/utils';
import { getWelcomePromoConfig, WelcomePromoBannerConfig } from '@/lib/spotlightConfig';

export interface PromotionalOfferCardProps {
  code?: string;
  discountText?: string;
  title?: string;
  description?: string;
  minOrder?: number;
  onApply?: (code: string) => Promise<void> | void;
  actionType?: 'apply' | 'copy_and_shop';
  className?: string;
}

export function PromotionalOfferCard({
  code: initialCode,
  discountText: initialDiscount,
  title: initialTitle,
  description: initialDescription,
  minOrder = 0,
  onApply,
  actionType = 'copy_and_shop',
  className,
}: PromotionalOfferCardProps) {
  const [promoConfig, setPromoConfig] = useState<WelcomePromoBannerConfig>(getWelcomePromoConfig);
  const [isCopied, setIsCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const copyTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync config from local/backend and listen for admin updates
  useEffect(() => {
    const syncConfig = () => {
      setPromoConfig(getWelcomePromoConfig());
    };

    syncConfig();

    // Fetch latest from server
    fetch('/api/settings/spotlight')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.banners?.welcomePromo) {
          setPromoConfig(data.banners.welcomePromo);
        }
      })
      .catch(() => {});

    window.addEventListener('pixello_banners_updated', syncConfig);
    window.addEventListener('storage', syncConfig);

    return () => {
      window.removeEventListener('pixello_banners_updated', syncConfig);
      window.removeEventListener('storage', syncConfig);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const promoCode = initialCode || promoConfig.code || 'WELCOME10';
  const discountLabel = initialDiscount || promoConfig.discountLabel || '10% OFF';
  const title = initialTitle || promoConfig.title || 'Special Limited-Time Promo';
  const description = initialDescription || promoConfig.description || 'Enjoy an exclusive instant discount on handcrafted frames, Polaroids, and customized gifts.';

  const handleAction = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (onApply) {
        await onApply(promoCode);
        setFeedbackMsg('Promo code applied successfully!');
      } else {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(promoCode);
        }
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(
              'pixello_cart_applied_promo',
              JSON.stringify({
                code: promoCode,
                value: 10,
                type: 'percentage',
              })
            );
          } catch {
            // Storage fallback
          }
        }
        setIsCopied(true);
        setFeedbackMsg('✓ Code copied! It will auto-apply in your cart & checkout.');
      }

      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => {
        setIsCopied(false);
        setFeedbackMsg('');
      }, 4000);
    } catch (err) {
      console.error('Failed to process promo offer:', err);
      setFeedbackMsg('Could not apply code. Please try manually entering it.');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, onApply, promoCode]);

  if (!promoConfig.enabled) {
    return null;
  }

  return (
    <BorderTrailCard2
      glowColor="pink"
      trailSize={120}
      active={true}
      className={cn(
        'border border-[#F2C8B5] bg-gradient-to-br from-white via-[#FFF9F5] to-[#FFF4ED] shadow-sm',
        'dark:border-[#7A4B3A] dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800',
        className
      )}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left Info Column */}
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#D89A86]/15 px-2.5 py-0.5 text-[11px] font-extrabold text-[#D89A86] border border-[#D89A86]/30">
              <Sparkles className="h-3 w-3" />
              {promoConfig.badge || 'Special Offer'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
              <ShieldCheck className="h-3 w-3" />
              {promoConfig.verifiedBadge || 'Verified Deal'}
            </span>
          </div>

          <h3 className="font-serif-brand text-lg sm:text-xl font-bold text-[#3A2B24] dark:text-zinc-100">
            {title} — <span className="text-[#D89A86]">{discountLabel}</span>
          </h3>

          <p className="text-xs sm:text-sm text-[#6C5C54] dark:text-zinc-400 leading-relaxed">
            {description}
            {minOrder > 0 && ` (Valid on orders above ₹${minOrder})`}
          </p>

          {feedbackMsg && (
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 animate-fadeIn flex items-center gap-1 pt-1">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              {feedbackMsg}
            </p>
          )}
        </div>

        {/* Right Action Column */}
        <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto shrink-0">
          {/* Coupon Code Pill */}
          <div className="flex items-center gap-1.5 rounded-2xl border-2 border-dashed border-[#D89A86] bg-white/90 px-3.5 py-2 shadow-2xs dark:bg-zinc-800">
            <Tag className="h-3.5 w-3.5 text-[#D89A86]" />
            <span className="font-mono text-sm font-black tracking-widest text-[#3A2B24] dark:text-zinc-100">
              {promoCode}
            </span>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleAction}
              disabled={isProcessing}
              aria-label={isCopied ? 'Code Copied' : (promoConfig.buttonText || 'Claim Promo Code')}
              className={cn(
                'flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer',
                isCopied
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-[#D89A86] text-white hover:bg-[#C58572] active:scale-95',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D89A86] focus-visible:ring-offset-2'
              )}
            >
              {isProcessing ? (
                <span>Applying...</span>
              ) : isCopied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Claimed!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>{promoConfig.buttonText || 'Claim & Copy Code'}</span>
                </>
              )}
            </button>

            {actionType === 'copy_and_shop' && (
              <Link
                href={promoConfig.shopLink || '/products'}
                className="hidden sm:inline-flex items-center justify-center gap-1 rounded-full border border-[#D89A86]/40 bg-white/80 px-3.5 py-2.5 text-xs font-bold text-[#3A2B24] hover:bg-[#FFF8F2] transition-colors dark:bg-zinc-800 dark:text-zinc-200"
              >
                <span>Shop</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </BorderTrailCard2>
  );
}

export default PromotionalOfferCard;
