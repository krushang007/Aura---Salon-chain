'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DiscoveryFilters } from './types';

export interface SalonFiltersProps {
  filters: DiscoveryFilters;
  onChange: (updated: DiscoveryFilters) => void;
}

export function SalonFilters({ filters, onChange }: SalonFiltersProps) {
  const localities = ['All Surat', 'Althan', 'Adajan', 'Vesu', 'Ghopad'];
  const categories = ['All Services', 'Haircut & Styling', 'Beard & Grooming', 'Color & Spa', 'Treatments'];

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
          placeholder="Search salons, stylists, or services in Surat..."
          className="h-10 w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 shadow-xs focus-visible:border-neutral-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-900"
        />
      </div>

      {/* Locality Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-neutral-500 mr-1">Locality:</span>
        {localities.map((loc) => {
          const isSelected = (loc === 'All Surat' && !filters.locality) || filters.locality === loc;
          return (
            <button
              key={loc}
              onClick={() => onChange({ ...filters, locality: loc === 'All Surat' ? '' : loc })}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                isSelected
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
              )}
            >
              {loc}
            </button>
          );
        })}
      </div>
    </div>
  );
}
