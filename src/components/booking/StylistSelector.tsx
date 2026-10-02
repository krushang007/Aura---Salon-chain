import * as React from 'react';
import { cn } from '@/lib/utils';
import { Star, Armchair, Check } from 'lucide-react';
import { StylistSummary } from './types';

export interface StylistSelectorProps {
  stylists: StylistSummary[];
  selectedStaffId: string | null;
  onSelect: (staffId: string) => void;
}

export function StylistSelector({ stylists, selectedStaffId, onSelect }: StylistSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600">
        1. Select Stylist & Chair Station
      </label>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {stylists.map((st) => {
          const isSelected = selectedStaffId === st.id;
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => onSelect(st.id)}
              className={cn(
                'relative flex items-center gap-3.5 rounded-xl border p-3.5 text-left transition-all',
                isSelected
                  ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm ring-1 ring-neutral-900'
                  : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/50'
              )}
            >
              {/* Initials Avatar */}
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  isSelected ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-900'
                )}
              >
                {st.fullName.slice(0, 2).toUpperCase()}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm truncate">{st.fullName}</p>
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-white" />}
                </div>
                <p className={cn('text-xs truncate', isSelected ? 'text-neutral-300' : 'text-neutral-500')}>
                  {st.title}
                </p>
                <div className="mt-1 flex items-center gap-2.5 text-[11px]">
                  <span className={cn('flex items-center gap-1', isSelected ? 'text-amber-300' : 'text-amber-600 font-medium')}>
                    <Star className="h-3 w-3 fill-current" />
                    {st.ratingAverage.toFixed(1)}
                  </span>
                  <span className={cn('flex items-center gap-1', isSelected ? 'text-neutral-300' : 'text-neutral-500')}>
                    <Armchair className="h-3 w-3" />
                    {st.chairStationName}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
