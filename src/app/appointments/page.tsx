'use client';

import * as React from 'react';
import Link from 'next/link';
import { BookingHistoryList } from '@/components/appointments';
import { BookingHistoryItem } from '@/components/appointments/types';
import { Button } from '@/components/core';
import { Calendar, Loader2 } from 'lucide-react';

export default function AppointmentsPage() {
  const [upcoming, setUpcoming] = React.useState<BookingHistoryItem[]>([]);
  const [past, setPast] = React.useState<BookingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchAppointments = React.useCallback(async () => {
    try {
      const res = await fetch('/api/appointments');
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      const data = await res.json();
      setUpcoming(data.upcoming || []);
      setPast(data.past || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking? This will immediately free the stylist chair.')) {
      return;
    }

    try {
      const res = await fetch('/api/booking/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: id }),
      });

      const result = await res.json();
      if (!res.ok) {
        alert(result.error || 'Cancellation failed');
        return;
      }

      alert('Appointment cancelled successfully.');
      fetchAppointments();
    } catch {
      alert('Error cancelling appointment.');
    }
  };

  const handleReschedule = (id: string) => {
    window.location.href = `/book/${id}`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-neutral-900">
              Appointments & History
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Manage scheduled salon seats, contactless reception QR passes, and view past visit folios in Surat.
            </p>
          </div>
          <Link href="/">
            <Button variant="primary" size="sm">
              Book New Appointment
            </Button>
          </Link>
        </div>

        <BookingHistoryList
          upcomingBookings={upcoming}
          pastVisits={past}
          onCancel={handleCancel}
          onReschedule={handleReschedule}
        />
      </div>
    </div>
  );
}
