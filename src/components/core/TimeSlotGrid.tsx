'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

export interface SlotItem {
  time: string; // '14:30'
  display: string; // '2:30 PM'
  isAvailable: boolean;
  bookedReason?: string;
}

export interface TimeSlotGridProps {
  slots: SlotItem[];
  selectedSlot: string | null;
  onSelectSlot: (slotTime: string) => void;
  className?: string;
  isLoading?: boolean;
}

export function TimeSlotGrid({
  slots,
  selectedSlot,
  onSelectSlot,
  className,
  isLoading = false,
}: TimeSlotGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="h-10 animate-pulse rounded-lg bg-neutral-100" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-center">
        <Clock className="mx-auto h-6 w-6 text-neutral-400" />
        <p className="mt-2 text-sm font-medium text-neutral-600">No available slots for this date</p>
        <p className="text-xs text-neutral-400">Try selecting an alternate day or stylist.</p>
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 gap-2 sm:grid-cols-3', className)}>
      {slots.map((s) => {
        const isSelected = selectedSlot === s.time;
        const isDisabled = !s.isAvailable;

        return (
          <button
            key={s.time}
            disabled={isDisabled}
            onClick={() => onSelectSlot(s.time)}
            className={cn(
              'flex h-11 items-center justify-center rounded-lg border text-sm font-semibold transition-all',
              isSelected && 'border-neutral-900 bg-neutral-900 text-white shadow-xs',
              !isSelected &&
                !isDisabled &&
                'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400 hover:bg-neutral-50',
              isDisabled &&
                'border-neutral-100 bg-neutral-50 text-neutral-300 line-through cursor-not-allowed'
            )}
            title={isDisabled ? s.bookedReason || 'Slot already booked' : undefined}
          >
            {s.display}
          </button>
        );
      })}
    </div>
  );
}
