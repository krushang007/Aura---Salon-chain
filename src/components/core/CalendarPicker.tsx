'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface CalendarPickerProps {
  selectedDate: string; // 'YYYY-MM-DD'
  onSelectDate: (date: string) => void;
  className?: string;
}

export function CalendarPicker({ selectedDate, onSelectDate, className }: CalendarPickerProps) {
  const [baseDate, setBaseDate] = React.useState(() => new Date());

  // Generate 7 upcoming days
  const days = React.useMemo(() => {
    const list = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      list.push({ iso, dayName, dayNum, monthName, raw: d });
    }
    return list;
  }, [baseDate]);

  const handlePrev = () => {
    const next = new Date(baseDate);
    next.setDate(baseDate.getDate() - 7);
    setBaseDate(next);
  };

  const handleNext = () => {
    const next = new Date(baseDate);
    next.setDate(baseDate.getDate() + 7);
    setBaseDate(next);
  };

  return (
    <div className={cn('rounded-xl border border-neutral-200 bg-white p-4 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-neutral-900">
          {days[0]?.monthName} {days[0]?.raw.getFullYear()}
        </h4>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNext}
            className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((item) => {
          const isSelected = item.iso === selectedDate;
          const isToday = item.iso === new Date().toISOString().split('T')[0];

          return (
            <button
              key={item.iso}
              onClick={() => onSelectDate(item.iso)}
              className={cn(
                'flex flex-col items-center justify-center rounded-lg p-2.5 transition-all text-center',
                isSelected
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100',
                isToday && !isSelected && 'border border-neutral-300'
              )}
            >
              <span className={cn('text-[11px] font-medium uppercase', isSelected ? 'text-neutral-300' : 'text-neutral-400')}>
                {item.dayName}
              </span>
              <span className="text-sm font-bold mt-0.5">{item.dayNum}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
