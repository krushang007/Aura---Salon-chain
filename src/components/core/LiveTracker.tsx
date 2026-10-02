import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check, Circle } from 'lucide-react';
import { AppointmentStatus } from './StatusBadge';

export interface LiveTrackerProps {
  status: AppointmentStatus;
  className?: string;
}

export function LiveTracker({ status, className }: LiveTrackerProps) {
  const steps = [
    { id: 1, title: 'Reservation Placed', subtitle: 'Step 1 • Booked', state: 'COMPLETED' },
    {
      id: 2,
      title: 'Chair & Slot Locked',
      subtitle: 'Step 2 • Confirmed',
      state: status === 'CONFIRMED' ? 'CURRENT' : status === 'CANCELLED' ? 'CANCELLED' : 'COMPLETED',
    },
    {
      id: 3,
      title: 'In-Salon Service',
      subtitle: 'Step 3 • In Service',
      state:
        status === 'IN_PROGRESS'
          ? 'CURRENT'
          : status === 'COMPLETED'
          ? 'COMPLETED'
          : 'PENDING',
    },
    {
      id: 4,
      title: 'Checkout & Review',
      subtitle: 'Step 4 • Finished',
      state: status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
    },
  ];

  if (status === 'CANCELLED') {
    return (
      <div className={cn('rounded-xl border border-red-200 bg-red-50/50 p-4 text-center', className)}>
        <p className="text-sm font-semibold text-red-700">Appointment Cancelled</p>
        <p className="text-xs text-red-600 mt-0.5">The chair reservation and slot have been released.</p>
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border border-neutral-200 bg-white p-4', className)}>
      {steps.map((step) => {
        const isDone = step.state === 'COMPLETED';
        const isCurrent = step.state === 'CURRENT';

        return (
          <div key={step.id} className="flex items-start gap-3">
            <div
              className={cn(
                'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                isDone && 'bg-neutral-900 text-white',
                isCurrent && 'border-2 border-emerald-600 bg-emerald-50 text-emerald-700 animate-pulse',
                !isDone && !isCurrent && 'border border-neutral-300 bg-neutral-100 text-neutral-400'
              )}
            >
              {isDone ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-2 w-2 fill-current" />}
            </div>
            <div className="space-y-0.5 min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 truncate">
                {step.subtitle}
              </p>
              <p
                className={cn(
                  'text-xs font-semibold truncate',
                  isCurrent ? 'text-emerald-700' : isDone ? 'text-neutral-900' : 'text-neutral-400'
                )}
              >
                {step.title}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
