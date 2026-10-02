import * as React from 'react';
import { Card, Button, Badge } from '@/components/core';
import { Calendar, Clock, Armchair, ShieldCheck, ArrowRight } from 'lucide-react';
import { StylistSummary, ServiceDetail } from './types';

export interface BookingSummaryCardProps {
  salonName: string;
  branchName: string;
  service?: ServiceDetail | null;
  stylist?: StylistSummary | null;
  selectedDate?: string;
  selectedSlotTime?: string | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function BookingSummaryCard({
  salonName,
  branchName,
  service,
  stylist,
  selectedDate,
  selectedSlotTime,
  onConfirm,
  isLoading = false,
}: BookingSummaryCardProps) {
  const isReady = Boolean(service && stylist && selectedDate && selectedSlotTime);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-6 space-y-5">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
          Booking Summary
        </span>
        <h3 className="font-display text-lg font-bold text-neutral-900 mt-1">
          {salonName}
        </h3>
        <p className="text-xs text-neutral-500">{branchName}</p>
      </div>

      <div className="space-y-3.5 border-y border-neutral-200/80 py-4 text-xs text-neutral-700">
        {/* Service */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-neutral-900 text-sm">
              {service ? service.title : 'Select a service...'}
            </p>
            {service && (
              <p className="text-neutral-500 text-[11px] mt-0.5">
                {service.durationMinutes} min service + {service.bufferMinutes} min prep buffer
              </p>
            )}
          </div>
          {service && (
            <p className="font-bold text-neutral-900 text-sm">₹{service.price}</p>
          )}
        </div>

        {/* Stylist & Station */}
        <div className="flex items-center justify-between border-t border-neutral-200/60 pt-3">
          <span className="text-neutral-500">Stylist & Station:</span>
          <span className="font-semibold text-neutral-900">
            {stylist ? `${stylist.fullName} (${stylist.chairStationName})` : 'Select stylist...'}
          </span>
        </div>

        {/* Payment */}
        <div className="flex items-center justify-between border-t border-neutral-200/60 pt-3">
          <span className="text-neutral-500">Payment Method:</span>
          <span className="font-semibold text-emerald-700">Pay at Salon Desk</span>
        </div>

        {/* Date & Time */}
        <div className="flex items-center justify-between">
          <span className="text-neutral-500">Scheduled Time:</span>
          <span className="font-semibold text-neutral-900">
            {selectedDate && selectedSlotTime
              ? `${selectedDate} at ${selectedSlotTime}`
              : 'Select date & time slot...'}
          </span>
        </div>
      </div>

      {/* Operational Policy Guarantee */}
      <div className="rounded-xl border border-neutral-200 bg-white p-3 space-y-1 text-[11px] text-neutral-500 leading-relaxed shadow-xs">
        <div className="flex items-center gap-1.5 font-semibold text-neutral-800">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Aura Booking & 2-Hour Window Policy
        </div>
        <p>
          Free self-service cancellation is available until 2 hours prior to start time. Cancelling instantly frees your chair slot. Strictly in-app confirmation with zero calendar invite delays.
        </p>
      </div>

      {/* Primary CTA */}
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={!isReady}
        isLoading={isLoading}
        onClick={onConfirm}
        rightIcon={<ArrowRight className="h-4 w-4" />}
      >
        Confirm Guaranteed Booking
      </Button>
    </div>
  );
}
