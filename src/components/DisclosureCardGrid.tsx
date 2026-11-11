'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { DisclosureCard } from '@/components/DisclosureCard';
import { useProducts, Product } from '@/context/ProductContext';
import { cn } from '@/lib/utils';

export interface DisclosureCardGridProps {
  title?: string;
  subtitle?: string;
  categoryFilter?: string;
  initialCategory?: string;
  limit?: number;
  showCategoryTabs?: boolean;
  className?: string;
  customProducts?: Product[];
}

export function DisclosureCardGrid({
  title = 'Interactive Product Showcase',
  subtitle = 'Tap any product card to expand detailed craftsmanship specs, print options, and instant cart ordering.',
  categoryFilter,
  initialCategory = 'All',
  limit,
  showCategoryTabs = true,
  className,
  customProducts,
}: DisclosureCardGridProps) {
  const { products: contextProducts } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  const allProducts = customProducts || contextProducts;

  // Derive unique categories from available products
  const categories = useMemo(() => {
    const set = new Set<string>(['All']);
    allProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [allProducts]);

  // Filter products by selected category
  const filteredProducts = useMemo(() => {
    let list = allProducts;
    if (categoryFilter) {
      list = list.filter(
        (p) => p.category?.toLowerCase() === categoryFilter.toLowerCase()
      );
    } else if (selectedCategory !== 'All') {
      list = list.filter(
        (p) => p.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (limit && limit > 0) {
      list = list.slice(0, limit);
    }

    return list;
  }, [allProducts, categoryFilter, selectedCategory, limit]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#D89A86]/15 px-3 py-1 text-xs font-bold text-[#D89A86] border border-[#D89A86]/30">
              <Sparkles className="h-3.5 w-3.5" /> Handcrafted Showcase
            </span>
          </div>
          <h2 className="font-serif-brand text-3xl sm:text-4xl font-bold tracking-tight text-[#3A2B24] dark:text-zinc-100">
            {title}
          </h2>
          <p className="text-sm text-[#6C5C54] dark:text-zinc-400 mt-1.5 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        </div>

        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D89A86] hover:text-[#C58572] transition-colors self-start md:self-auto"
        >
          <span>Explore All Products</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Category Filter Pills (if enabled) */}
      {showCategoryTabs && !categoryFilter && categories.length > 2 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer border',
                  isSelected
                    ? 'bg-[#3A2B24] text-white border-[#3A2B24] shadow-xs dark:bg-[#D89A86] dark:border-[#D89A86]'
                    : 'bg-white text-[#6C5C54] hover:bg-[#FFF8F2] hover:text-[#3A2B24] border-[#EFE6DD] dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300'
                )}
              >
                <span>{cat === 'All' ? 'All Collections' : cat}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Responsive Grid of Disclosure Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <DisclosureCard
            key={product.id}
            product={product}
            imageAspectRatio="square"
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-3xl border border-[#EFE6DD] p-8 dark:bg-zinc-800 dark:border-zinc-700">
          <p className="text-sm font-bold text-[#3A2B24] dark:text-zinc-200">
            No products found in this category.
          </p>
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className="mt-3 text-xs font-bold text-[#D89A86] underline cursor-pointer"
          >
            Reset to All Collections
          </button>
        </div>
      )}
    </div>
  );
}

export default DisclosureCardGrid;
