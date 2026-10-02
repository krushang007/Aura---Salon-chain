'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DigitalPassCard } from '@/components/appointments';
import { AppointmentPassData } from '@/components/appointments/types';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button, CalendarPicker, TimeSlotGrid, Modal, SlotItem, useToast } from '@/components/core';
import { createClient } from '@/lib/supabase/client';

export default function AppointmentPassPage({ params }: { params: { id: string } }) {
  const toast = useToast();
  const router = useRouter();
  const [pass, setPass] = React.useState<AppointmentPassData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [feedbackMessage, setFeedbackMessage] = React.useState<string | null>(null);
  const [feedbackType, setFeedbackType] = React.useState<'success' | 'error'>('success');

  // Reschedule Modal State
  const [isRescheduleOpen, setIsRescheduleOpen] = React.useState(false);
  const [rescheduleDate, setRescheduleDate] = React.useState('');
  const [rescheduleSlot, setRescheduleSlot] = React.useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = React.useState<SlotItem[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = React.useState(false);
  const [isRescheduling, setIsRescheduling] = React.useState(false);

  const fetchPass = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/appointments/${params.id}`);
      if (!res.ok) {
        router.push('/appointments');
        return;
      }
      const data = await res.json();
      setPass(data.pass);
    } catch (err) {
      console.error('Error loading pass:', err);
    } finally {
      setIsLoading(false);
    }
  }, [params.id, router]);

  React.useEffect(() => {
    fetchPass();
  }, [fetchPass]);

  // Realtime Supabase Subscription for instant status updates
  React.useEffect(() => {
    if (!params.id) return;
    try {
      const supabase = createClient();
      const channel = supabase
        .channel(`pass-live-${params.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'appointments',
            filter: `id=eq.${params.id}`,
          },
          (payload: { new?: Partial<AppointmentPassData> }) => {
            if (payload.new && payload.new.status) {
              setPass((prev) => (prev ? { ...prev, status: payload.new!.status! } : null));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Realtime channel subscription skipped:', err);
    }
  }, [params.id]);

  // Set default reschedule date when modal opens
  React.useEffect(() => {
    if (isRescheduleOpen && !rescheduleDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setRescheduleDate(tomorrow.toISOString().split('T')[0]);
    }
  }, [isRescheduleOpen, rescheduleDate]);

  // Fetch slots for reschedule
  React.useEffect(() => {
    if (!isRescheduleOpen || !rescheduleDate || !pass) return;

    async function fetchRescheduleSlots() {
      setIsLoadingSlots(true);
      setRescheduleSlot(null);
      try {
        const res = await fetch(
          `/api/booking/slots?storeId=${pass?.storeId || ''}&staffId=${pass?.staffId || ''}&serviceId=${pass?.serviceId || ''}&date=${rescheduleDate}`
        );
        const data = await res.json();
        setAvailableSlots(data.slots || []);
      } catch (err) {
        console.error('Error fetching reschedule slots:', err);
      } finally {
        setIsLoadingSlots(false);
      }
    }

    fetchRescheduleSlots();
  }, [isRescheduleOpen, rescheduleDate, pass]);

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment? Your reserved chair slot will be released immediately.')) {
      return;
    }

    setIsCancelling(true);
    setFeedbackMessage(null);

    try {
      const res = await fetch('/api/booking/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId }),
      });

      const result = await res.json();
      if (!res.ok) {
        setFeedbackType('error');
        setFeedbackMessage(result.error || 'Cancellation failed');
        setIsCancelling(false);
        return;
      }

      setFeedbackType('success');
      setFeedbackMessage('Appointment successfully cancelled. The chair slot has been freed.');
      await fetchPass();
    } catch {
      setFeedbackType('error');
      setFeedbackMessage('Network error while cancelling appointment.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleDate || !rescheduleSlot) return;

    setIsRescheduling(true);
    setFeedbackMessage(null);

    try {
      const res = await fetch('/api/booking/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: params.id,
          newDate: rescheduleDate,
          newSlotTime: rescheduleSlot,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setFeedbackType('error');
        setFeedbackMessage(result.error || 'Reschedule failed');
        setIsRescheduling(false);
        return;
      }

      setIsRescheduleOpen(false);
      setFeedbackType('success');
      setFeedbackMessage(`Appointment successfully rescheduled to ${rescheduleDate} at ${rescheduleSlot}.`);
      await fetchPass();
    } catch {
      setFeedbackType('error');
      setFeedbackMessage('Network error while rescheduling appointment.');
    } finally {
      setIsRescheduling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!pass) return null;

  return (
    <div className="min-h-screen bg-white py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">
        <Link
          href="/appointments"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to All Appointments
        </Link>

        {feedbackMessage && (
          <div
            className={`rounded-xl border p-4 text-xs font-semibold ${
              feedbackType === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {feedbackMessage}
          </div>
        )}

        <DigitalPassCard
          pass={pass}
          onCancel={handleCancelAppointment}
          onReschedule={() => setIsRescheduleOpen(true)}
          isCancelling={isCancelling}
        />

        {/* Reschedule Modal */}
        <Modal
          isOpen={isRescheduleOpen}
          onClose={() => setIsRescheduleOpen(false)}
          title="Reschedule Appointment"
          description="Select a new date and available slot. Subject to the 2-hour salon cutoff policy."
        >
          <div className="space-y-6 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-2">
                1. Select New Date
              </label>
              <CalendarPicker
                selectedDate={rescheduleDate}
                onSelectDate={setRescheduleDate}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-2">
                2. Select Available Slot
              </label>
              <TimeSlotGrid
                slots={availableSlots}
                selectedSlot={rescheduleSlot}
                onSelectSlot={setRescheduleSlot}
                isLoading={isLoadingSlots}
              />
            </div>

            <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs flex items-center justify-end gap-3 border-t border-neutral-100 pt-3 pb-1 mt-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsRescheduleOpen(false)}
                disabled={isRescheduling}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRescheduleSubmit}
                isLoading={isRescheduling}
                disabled={!rescheduleSlot || isRescheduling}
              >
                Confirm Reschedule
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
