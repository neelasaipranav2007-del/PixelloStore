'use client';

import React, { useMemo } from 'react';
import { Wand2, Sparkles, X, Check } from 'lucide-react';
import { TextMorph } from '@/components/core/text-morph';
import { cn } from '@/lib/utils';

export interface ProductSuggestionConfig {
  label: string;
  placeholder: string;
  suggestions: string[];
  helperText: string;
}

/**
 * Returns tailored presets and instructions based on the product name and category.
 */
export function getProductSuggestions(
  productName: string = '',
  category: string = ''
): ProductSuggestionConfig {
  const name = productName.toLowerCase();
  const cat = category.toLowerCase();

  if (name.includes('panda') || cat.includes('panda')) {
    return {
      label: 'Add Free Personalized Message Card',
      placeholder: 'e.g. Light up your cute moments! Happy Birthday ❤️',
      suggestions: ['Happy Birthday 🎂', 'Stay Awesome', 'With Love ❤️', 'Shine Bright ✨', 'Sweet Dreams'],
      helperText: 'A personalized greeting message card will be printed and included in the gift box.',
    };
  }

  if (name.includes('timer') || cat.includes('timer') || name.includes('liquid')) {
    return {
      label: 'Add Free Personalized Gift Message',
      placeholder: 'e.g. For your work desk • Stay calm & focused',
      suggestions: ['Calm & Focused 🌿', 'Work Desk Vibes', 'Just For You ❤️', 'Best Wishes', 'Stay Inspired'],
      helperText: 'A handwritten-style gift card will accompany your calming liquid motion timer.',
    };
  }

  if (name.includes('paper weight') || name.includes('paperweight') || name.includes('forever us')) {
    return {
      label: 'Add Free Inscription / Couple Dedication',
      placeholder: 'e.g. Rahul & Sneha • Forever Us ❤️',
      suggestions: ['Forever Us ❤️', 'Together Always', 'Soulmates', 'Endless Love', 'You & Me', 'Anniversary'],
      helperText: 'Your dedication will be custom printed on the display plaque of the keepsake.',
    };
  }

  if (name.includes('lamp') || cat.includes('lamp') || cat.includes('led')) {
    return {
      label: 'Add Custom Laser Engraving Text (Free)',
      placeholder: 'e.g. Rahul & Sneha • 14.02.2024',
      suggestions: ['Forever Yours ❤️', 'Light Up My Life ✨', 'Happy Anniversary', 'Soulmates', 'Shine Bright'],
      helperText: 'Precision laser engraved on the solid base with radiant warm LED lighting.',
    };
  }

  if (name.includes('key chain') || name.includes('keychain') || cat.includes('keychain')) {
    return {
      label: 'Add Custom Name / Vehicle No / Date (Free)',
      placeholder: 'e.g. Rahul • AP09 CZ 1234 • Ride Safe',
      suggestions: ['Ride Safe 🛵', 'Drive Safe ❤️', 'Always With You', 'Special Date', 'Love You'],
      helperText: 'High-definition double-sided UV print on crystal acrylic.',
    };
  }

  if (name.includes('mug') || cat.includes('mug')) {
    return {
      label: 'Add Custom Name / Quote on Mug (Free)',
      placeholder: 'e.g. World\'s Best Mom • Coffee First',
      suggestions: ['Coffee & You ☕', 'Best Mom Ever ❤️', 'Best Dad Ever', 'Start With a Smile', 'Warm Hugs'],
      helperText: 'High gloss sublimation printing with vibrant, dishwasher-safe colors.',
    };
  }

  if (cat.includes('polaroid') || name.includes('polaroid')) {
    return {
      label: 'Add Custom Caption or Date for Prints (Free)',
      placeholder: 'e.g. Summer Memories 2024 • Cherish Every Day',
      suggestions: ['Sweet Memories', 'Moments in Time', 'Pure Joy ✨', 'Unforgettable', 'Good Times', 'Cherish'],
      helperText: 'Printed delicately across the border margins of your retro polaroid prints.',
    };
  }

  // Default: Photo Frames & Custom Wall Decor
  return {
    label: 'Add Custom Inscription / Dedication (Free)',
    placeholder: 'e.g. Forever & Always • Our Happy Place',
    suggestions: ['Forever & Always', 'Our Happy Place', 'Best Friends Forever', 'To the Moon & Back ❤️', 'Making Memories', 'Cherish Today'],
    helperText: 'Delicately printed alongside your photo using archival studio inks.',
  };
}

export interface ProductTextCustomizerProps {
  value: string;
  onChange: (value: string) => void;
  productName?: string;
  productCategory?: string;
  label?: string;
  placeholder?: string;
  maxLength?: number;
  suggestions?: string[];
  helperText?: string;
  className?: string;
}

export function ProductTextCustomizer({
  value,
  onChange,
  productName = '',
  productCategory = '',
  label,
  placeholder,
  maxLength = 45,
  suggestions: customSuggestions,
  helperText: customHelperText,
  className,
}: ProductTextCustomizerProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const config = useMemo(() => {
    return getProductSuggestions(productName, productCategory);
  }, [productName, productCategory]);

  const activeLabel = label || config.label;
  const activePlaceholder = placeholder || config.placeholder;
  const activeSuggestions = customSuggestions && customSuggestions.length > 0 ? customSuggestions : config.suggestions;
  const activeHelper = customHelperText || config.helperText;

  const handleSelectSuggestion = (suggestion: string) => {
    if (value.trim().toLowerCase() === suggestion.trim().toLowerCase()) {
      onChange('');
    } else {
      onChange(suggestion);
    }
  };

  const handleClear = () => {
    onChange('');
  };

  // Display text for TextMorph: show entered text or a gentle default preview prompt
  const previewText = value.trim() ? value : 'Your Message Preview ✨';

  return (
    <div
      suppressHydrationWarning
      className={cn(
        'w-full p-4 sm:p-5 rounded-2xl border border-[#EFE6DD] bg-white shadow-2xs space-y-3.5 transition-all',
        className
      )}
    >
      {/* Header with Title and Free Badge */}
      <div className="flex items-center justify-between">
        <label
          htmlFor="product-custom-text-input"
          className="text-xs sm:text-sm font-bold text-[#3A2B24] flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="h-4 w-4 text-[#D89A86]" />
          <span>{activeLabel}</span>
        </label>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#D89A86] bg-[#FFF8F2] border border-[#D89A86]/30 px-2.5 py-0.5 rounded-full shadow-2xs">
          100% Free
        </span>
      </div>

      {/* Live Morphing Preview Plaque */}
      <div className="relative overflow-hidden rounded-xl border border-[#EFE6DD] bg-gradient-to-r from-[#FFF8F2] via-white to-[#FFF8F2] p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-7 w-7 rounded-full bg-[#FFF8F2] border border-[#D89A86]/30 flex items-center justify-center shrink-0">
            <Wand2 className="h-3.5 w-3.5 text-[#D89A86]" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C5C54] block">
              Live Inscription Preview
            </span>
            <div
              suppressHydrationWarning
              className="font-serif-brand text-base sm:text-lg font-bold text-[#D89A86] tracking-tight leading-snug truncate"
            >
              <TextMorph>{previewText}</TextMorph>
            </div>
          </div>
        </div>

        {value.trim() ? (
          <span className="self-end sm:self-center text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs shrink-0">
            <Check className="h-3 w-3 text-emerald-600" />
            Applied to Order
          </span>
        ) : (
          <span className="self-end sm:self-center text-[10px] font-semibold text-[#6C5C54]/80 italic shrink-0">
            Type below or tap suggestions
          </span>
        )}
      </div>

      {/* Interactive Input Pill (Matching TextMorphInput design) */}
      <div className="relative flex items-center">
        <div className="absolute left-4 text-[#D89A86] pointer-events-none">
          <Wand2 className="h-4 w-4" />
        </div>

        <input
          id="product-custom-text-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={activePlaceholder}
          maxLength={maxLength}
          autoComplete="off"
          data-1p-ignore="true"
          data-lpignore="true"
          suppressHydrationWarning
          className={cn(
            'w-full h-12 pl-11 pr-24 rounded-full border border-[#EFE6DD] bg-white text-xs sm:text-sm font-semibold text-[#3A2B24] shadow-xs',
            'placeholder:text-[#6C5C54]/50 placeholder:font-normal',
            'focus:border-[#D89A86] focus:ring-2 focus:ring-[#D89A86]/20 focus:outline-none transition-all'
          )}
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              suppressHydrationWarning
              className="h-6 w-6 rounded-full bg-[#FFF8F2] hover:bg-[#F2C8B5]/40 text-[#6C5C54] hover:text-[#3A2B24] flex items-center justify-center transition-colors text-xs cursor-pointer border border-[#EFE6DD]"
              title="Clear message"
            >
              <X className="h-3 w-3" />
            </button>
          )}

          <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#D89A86]/90 px-2 py-0.5 rounded-md bg-[#FFF8F2] border border-[#D89A86]/20 pointer-events-none">
            LIVE
          </span>
        </div>
      </div>

      {/* Suggestions Row (Matching TextMorphInput suggestion pills) */}
      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
        <span className="text-[11px] font-bold text-[#6C5C54] mr-0.5">
          Suggestions:
        </span>
        {activeSuggestions.map((suggestion) => {
          const isSelected = value.trim().toLowerCase() === suggestion.trim().toLowerCase();
          return (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              suppressHydrationWarning
              className={cn(
                'px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border',
                isSelected
                  ? 'bg-[#D89A86] text-white border-[#D89A86] shadow-2xs scale-105'
                  : 'bg-white text-[#6C5C54] hover:bg-[#FFF8F2] hover:text-[#3A2B24] border-[#EFE6DD]'
              )}
            >
              {suggestion}
            </button>
          );
        })}
      </div>

      {/* Footer helper note and character counter */}
      <div className="flex items-center justify-between text-[11px] text-[#6C5C54] pt-1 border-t border-[#EFE6DD]/70">
        <span className="truncate pr-2">{activeHelper}</span>
        <span className="shrink-0 font-mono text-[10px] text-[#6C5C54]/70">
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
}

export default ProductTextCustomizer;
