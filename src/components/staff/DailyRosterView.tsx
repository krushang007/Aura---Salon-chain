'use client';

import * as React from 'react';
import { Button, StatusBadge, Badge } from '@/components/core';
import { Calendar, Clock, Armchair, PlusCircle } from 'lucide-react';
import { RosterSlotBooking } from './types';

export interface DailyRosterViewProps {
  stylistName: string;
  chairName: string;
  dateFormatted: string;
  bookings: RosterSlotBooking[];
  onOpenQuickBook: () => void;
  onUpdateStatus: (appointmentId: string, nextStatus: 'IN_PROGRESS' | 'COMPLETED') => void;
}

export function DailyRosterView({
  stylistName,
  chairName,
  dateFormatted,
  bookings,
  onOpenQuickBook,
  onUpdateStatus,
}: DailyRosterViewProps) {
  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display text-xl font-bold text-neutral-900">Stylist Daily Roster: {stylistName}</h1>
            <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700">
              {chairName}
            </span>
          </div>
          <p className="text-xs text-neutral-500 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Today Schedule • {dateFormatted} • {bookings.length} scheduled services
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={onOpenQuickBook}
          leftIcon={<PlusCircle className="h-4 w-4" />}
        >
          Quick Walk-in Booking
        </Button>
      </div>

      {/* Roster Timeline */}
      <div className="space-y-3">
        {bookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 p-8 text-center text-xs text-neutral-500">
            No bookings scheduled for this shift. Station is ready for walk-in arrivals.
          </div>
        ) : (
          bookings.map((slot) => {
            const isConfirmed = slot.status === 'CONFIRMED';
            const isInProgress = slot.status === 'IN_PROGRESS';
            const isCompleted = slot.status === 'COMPLETED';

            return (
              <div
                key={slot.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-xs transition-colors hover:border-neutral-300"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-20 shrink-0 flex-col items-center justify-center rounded-lg bg-neutral-50 border border-neutral-200 text-center">
                    <span className="text-xs font-bold text-neutral-900">{slot.timeDisplay}</span>
                    <span className="text-[10px] text-neutral-400">{slot.durationMinutes} min</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-neutral-900">{slot.customerName}</p>
                      <StatusBadge status={slot.status} />
                    </div>
                    <p className="text-xs text-neutral-600 font-medium">{slot.serviceTitle}</p>
                    <p className="text-[11px] text-neutral-400">
                      Station: {slot.chairStationName} {slot.customerPhone && `• ${slot.customerPhone}`}
                    </p>
                  </div>
                </div>

                {/* Inline Action Controls */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {isConfirmed && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onUpdateStatus(slot.id, 'IN_PROGRESS')}
                    >
                      Start Service
                    </Button>
                  )}
                  {isInProgress && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => onUpdateStatus(slot.id, 'COMPLETED')}
                    >
                      Complete & Bill
                    </Button>
                  )}
                  {isCompleted && (
                    <span className="text-xs font-medium text-neutral-400">
                      ✓ Service Finished
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
