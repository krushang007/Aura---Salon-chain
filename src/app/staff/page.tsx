'use client';

import * as React from 'react';
import { DailyRosterView, QuickWalkinModal } from '@/components/staff';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function StaffPortalPage() {
  const [rosterData, setRosterData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isQuickBookOpen, setIsQuickBookOpen] = React.useState(false);

  const fetchRoster = React.useCallback(async () => {
    try {
      const res = await fetch('/api/staff/roster');
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/login';
        return;
      }
      const data = await res.json();
      setRosterData(data);
    } catch (err) {
      console.error('Error fetching roster:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  // Realtime Supabase Subscription for live roster updates
  React.useEffect(() => {
    try {
      const supabase = createClient();
      const channel = supabase
        .channel('staff-roster-live')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'appointments',
          },
          () => {
            fetchRoster();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Staff roster realtime skipped:', err);
    }
  }, [fetchRoster]);

  const handleUpdateStatus = async (appointmentId: string, status: 'IN_PROGRESS' | 'COMPLETED') => {
    try {
      const res = await fetch('/api/staff/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, status }),
      });
      if (res.ok) {
        fetchRoster();
      } else {
        alert('Failed to update status');
      }
    } catch {
      alert('Error updating appointment status');
    }
  };

  const handleQuickBook = async (input: any) => {
    try {
      const res = await fetch('/api/staff/quick-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (res.ok) {
        alert('Walk-in booking locked successfully!');
        fetchRoster();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to book walk-in');
      }
    } catch {
      alert('Error booking walk-in appointment');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">
        <DailyRosterView
          stylistName={rosterData?.stylistName || 'Rahul Mehta'}
          chairName={rosterData?.chairName || 'Chair 03'}
          dateFormatted={rosterData?.dateFormatted || 'Today'}
          bookings={rosterData?.bookings || []}
          onOpenQuickBook={() => setIsQuickBookOpen(true)}
          onUpdateStatus={handleUpdateStatus}
        />

        <QuickWalkinModal
          isOpen={isQuickBookOpen}
          onClose={() => setIsQuickBookOpen(false)}
          storeId={rosterData?.storeId || ""}
          staffId={rosterData?.staffId || ""}
          stylistName={rosterData?.stylistName || "Rahul Mehta"}
          services={rosterData?.services || []}
          onSubmit={handleQuickBook}
        />
      </div>
    </div>
  );
}
