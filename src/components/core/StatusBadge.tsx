import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from './Badge';

export type AppointmentStatus =
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'RESCHEDULE_NEEDED';

export function StatusBadge({
  status,
  className,
}: {
  status: AppointmentStatus;
  className?: string;
}) {
  const configs: Record<
    AppointmentStatus,
    { label: string; variant: 'success' | 'warning' | 'destructive' | 'neutral' | 'outline' }
  > = {
    CONFIRMED: { label: 'Confirmed', variant: 'success' },
    IN_PROGRESS: { label: 'In Service', variant: 'warning' },
    COMPLETED: { label: 'Completed', variant: 'neutral' },
    CANCELLED: { label: 'Cancelled', variant: 'destructive' },
    NO_SHOW: { label: 'No Show', variant: 'destructive' },
    RESCHEDULE_NEEDED: { label: 'Reschedule Needed', variant: 'warning' },
  };

  const config = configs[status] || { label: status, variant: 'neutral' };

  return (
    <Badge variant={config.variant} dot className={cn('uppercase font-semibold text-[11px]', className)}>
      {config.label}
    </Badge>
  );
}
