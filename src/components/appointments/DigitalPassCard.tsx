'use client';

import * as React from 'react';
import { Button, Badge, LiveTracker, QrCodeView } from '@/components/core';
import { Calendar, Clock, MapPin, Phone, AlertCircle, Navigation, RefreshCw, XCircle } from 'lucide-react';
import { AppointmentPassData } from './types';

export interface DigitalPassCardProps {
  pass: AppointmentPassData;
  onCancel: (appointmentId: string) => void;
  onReschedule: (appointmentId: string) => void;
  isCancelling?: boolean;
}

export function DigitalPassCard({ pass, onCancel, onReschedule, isCancelling = false }: DigitalPassCardProps) {
  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              CONFIRMED
            </span>
            <span className="font-mono text-xs font-semibold text-neutral-400">
              {pass.passNumber}
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
            Appointment Confirmed
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Your reservation at {pass.salonName} has been confirmed and locked into the salon booking calendar.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-neutral-600 self-start sm:self-auto">
          <Phone className="h-4 w-4 text-neutral-400" />
          <span>Salon Desk: {pass.deskPhone}</span>
        </div>
      </div>

      {/* 4-Step Live Visual Tracker */}
      <LiveTracker status={pass.status} />

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Card: Service & Stylist Specifics */}
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-5 shadow-xs">
            {/* Service & Price */}
            <div className="flex items-start justify-between border-b border-neutral-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Confirmed Service
                </span>
                <h3 className="font-display text-xl font-bold text-neutral-900 mt-0.5">
                  {pass.serviceTitle}
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Includes tailored scalp consultation, precision scissor cut & styling.
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl font-bold text-neutral-900">₹{pass.servicePrice}</p>
                <p className="text-[11px] text-neutral-400">Tax inclusive • Pay at salon</p>
              </div>
            </div>

            {/* Time & Assigned Stylist */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs text-neutral-700">
              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-neutral-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-neutral-400 text-[11px] uppercase tracking-wider font-medium">Date & Time</p>
                  <p className="font-semibold text-neutral-900 mt-0.5">
                    {new Date(pass.slotStartTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(pass.slotStartTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                  <p className="text-neutral-400 text-[11px] mt-0.5">
                    {pass.durationMinutes} min duration (+{pass.bufferMinutes} min buffer)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="h-4 w-4 text-neutral-400 mt-0.5 shrink-0 text-base">👤</span>
                <div>
                  <p className="text-neutral-400 text-[11px] uppercase tracking-wider font-medium">Professional Assigned</p>
                  <p className="font-semibold text-neutral-900 mt-0.5">{pass.stylistName}</p>
                  <p className="text-neutral-500 text-[11px] mt-0.5">
                    {pass.stylistTitle} • {pass.chairStationName}
                  </p>
                </div>
              </div>
            </div>

            {/* Salon Venue */}
            <div className="border-t border-neutral-100 pt-4 flex items-start gap-2.5 text-xs">
              <MapPin className="h-4 w-4 text-neutral-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-neutral-400 text-[11px] uppercase tracking-wider font-medium">Salon Venue</p>
                <p className="font-semibold text-neutral-900 mt-0.5">{pass.branchName}</p>
                <p className="text-neutral-500 text-xs mt-0.5">{pass.branchAddress}</p>
              </div>
            </div>

            {/* 2-Hour Cancellation Window Callout */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-3.5 flex items-start gap-3 text-xs text-neutral-600">
              <AlertCircle className="h-4 w-4 text-neutral-700 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-neutral-900">2-Hour Cancellation Window</p>
                <p className="mt-0.5 text-neutral-500 leading-relaxed text-[11px]">
                  Free self-service cancellation and rescheduling available until{' '}
                  <span className="font-semibold text-neutral-800">{pass.cancellationCutoffTime}</span>.
                  Cancelling instantly frees your chair slot for others in the salon waiting queue.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Contactless QR Pass & Actions */}
        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 uppercase tracking-wider">
              <span>Contactless Reception Pass</span>
              <span className="font-mono text-neutral-400">{pass.passNumber}</span>
            </div>

            {/* QR Code */}
            <QrCodeView code={pass.passNumber} />

            {/* Station & Arrival Window */}
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-neutral-50 p-3 text-center text-xs">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">Assigned Station</p>
                <p className="font-semibold text-neutral-900 mt-0.5">{pass.chairStationName}</p>
              </div>
              <div className="border-l border-neutral-200">
                <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">Arrival Window</p>
                <p className="font-semibold text-neutral-900 mt-0.5">{pass.arrivalWindow}</p>
              </div>
            </div>

            {/* Actions (Zero calendar invite; strict in-app) */}
            <div className="space-y-2 pt-2">
              <Button
                variant="outline"
                size="md"
                className="w-full"
                leftIcon={<Navigation className="h-4 w-4" />}
                onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(pass.branchAddress)}`, '_blank')}
              >
                Get Salon Directions
              </Button>

              <Button
                variant="outline"
                size="md"
                className="w-full"
                leftIcon={<RefreshCw className="h-4 w-4" />}
                onClick={() => onReschedule(pass.id)}
              >
                Reschedule Appointment
              </Button>

              {pass.canCancel && (
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={() => onCancel(pass.id)}
                  className="w-full text-center text-xs font-medium text-neutral-500 hover:text-red-600 transition-colors py-2 flex items-center justify-center gap-1.5"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Cancel Appointment — Frees chair slot
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
