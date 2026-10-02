'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StylistSelector, BookingSummaryCard } from '@/components/booking';
import { StylistSummary, ServiceDetail } from '@/components/booking/types';
import { CalendarPicker, TimeSlotGrid } from '@/components/core';
import { ArrowLeft, Check, Clock, MapPin, Sparkles, Loader2, AlertCircle } from 'lucide-react';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function BookingPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  const [store, setStore] = React.useState<any>(null);
  const [stylists, setStylists] = React.useState<StylistSummary[]>([]);
  const [services, setServices] = React.useState<ServiceDetail[]>([]);
  const [isLoadingPage, setIsLoadingPage] = React.useState(true);

  const [selectedStaffId, setSelectedStaffId] = React.useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = React.useState<string | null>(null);
  const [selectedDate, setSelectedDate] = React.useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null);
  const [customerNotes, setCustomerNotes] = React.useState<string>('');

  const [availableSlots, setAvailableSlots] = React.useState<any[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // 1. Fetch store info, services & stylists using live API
  React.useEffect(() => {
    async function loadData() {
      setIsLoadingPage(true);
      setErrorMessage(null);

      try {
        const res = await fetch(`/api/discovery/salons/${params.id}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          setErrorMessage(errData.error || 'Failed to load salon details');
          setIsLoadingPage(false);
          return;
        }

        const data = await res.json();
        setStore(data.store);
        setStylists(data.stylists || []);
        setServices(data.services || []);

        // Pre-select first stylist & service if available
        if (data.stylists && data.stylists.length > 0) {
          setSelectedStaffId(data.stylists[0].id);
        }
        if (data.services && data.services.length > 0) {
          setSelectedServiceId(data.services[0].id);
        }
      } catch (err) {
        console.error('Error fetching salon details:', err);
        setErrorMessage('Failed to connect to salon servers.');
      } finally {
        setIsLoadingPage(false);
      }
    }
    loadData();
  }, [params.id]);

  // 2. Fetch available slots when stylist, service, or date changes
  React.useEffect(() => {
    if (!selectedStaffId || !selectedServiceId || !selectedDate) return;
    if (!UUID_REGEX.test(selectedStaffId) || !UUID_REGEX.test(selectedServiceId) || !UUID_REGEX.test(params.id)) return;

    async function fetchSlots() {
      setIsLoadingSlots(true);
      setSelectedSlot(null);
      try {
        const res = await fetch(
          `/api/booking/slots?storeId=${params.id}&staffId=${selectedStaffId}&serviceId=${selectedServiceId}&date=${selectedDate}`
        );
        const data = await res.json();
        setAvailableSlots(data.slots || []);
      } catch (err) {
        console.error('Error fetching slots:', err);
      } finally {
        setIsLoadingSlots(false);
      }
    }

    fetchSlots();
  }, [params.id, selectedStaffId, selectedServiceId, selectedDate]);

  const selectedStylist = stylists.find((s) => s.id === selectedStaffId) || null;
  const selectedService = services.find((s) => s.id === selectedServiceId) || null;

  const handleConfirmBooking = async () => {
    if (!selectedStaffId || !selectedServiceId || !selectedDate || !selectedSlot) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/booking/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: params.id,
          staffId: selectedStaffId,
          serviceId: selectedServiceId,
          date: selectedDate,
          slotTime: selectedSlot,
          customerNotes: customerNotes.trim() || undefined,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = `/login?redirect=/book/${params.id}`;
          return;
        }
        setErrorMessage(result.error || 'Failed to book slot');
        setIsSubmitting(false);
        return;
      }

      router.push(`/appointments/${result.appointmentId}`);
    } catch {
      setErrorMessage('Network connection error. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isLoadingPage) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Top Header */}
      <div className="border-b border-neutral-200 bg-neutral-50/50 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Salons
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                {store?.branchName || 'Salon Bonanza'}
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {store?.address || 'Surat, Gujarat'}
              </p>
            </div>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700 self-start sm:self-auto">
              {store?.totalStylingChairs || 5} Active Chairs • 0 Overbooking Guarantee
            </span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
            {errorMessage}
          </div>
        </div>
      )}

      {stylists.length === 0 || services.length === 0 ? (
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <div className="rounded-2xl border border-dashed border-neutral-200 p-12 space-y-4">
            <AlertCircle className="mx-auto h-10 w-10 text-neutral-400" />
            <h2 className="font-display text-lg font-bold text-neutral-900">
              Atelier Setup in Progress
            </h2>
            <p className="text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
              This salon outlet is currently configuring physical styling chairs and shift schedules. Online bookings will be published shortly.
            </p>
            <Link href="/" className="inline-block pt-2">
              <span className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors">
                Explore Other Active Salons
              </span>
            </Link>
          </div>
        </div>
      ) : (
        /* Main 2-Column Booking Flow */
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            {/* Left Flow: Stylist -> Service -> Date -> Slots */}
            <div className="space-y-8 lg:col-span-7">
              {/* Step 1: Stylist */}
              <StylistSelector
                stylists={stylists}
                selectedStaffId={selectedStaffId}
                onSelect={setSelectedStaffId}
              />

              {/* Step 2: Service Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  2. Select Service
                </label>
                <div className="space-y-2">
                  {services.map((srv) => {
                    const isSelected = selectedServiceId === srv.id;
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => setSelectedServiceId(srv.id)}
                        className={`w-full flex items-start justify-between rounded-xl border p-4 text-left transition-all ${
                          isSelected
                            ? 'border-neutral-900 bg-neutral-50/50 shadow-xs ring-1 ring-neutral-900'
                            : 'border-neutral-200 bg-white hover:border-neutral-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-neutral-900">{srv.title}</p>
                            <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
                              +{srv.bufferMinutes}m buffer
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 leading-relaxed">{srv.description}</p>
                          <p className="text-xs font-medium text-neutral-400">
                            {srv.durationMinutes} min appointment
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-base font-bold text-neutral-900">₹{srv.price}</p>
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-900 mt-1">
                              <Check className="h-3.5 w-3.5" /> Selected
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Date & 15-Minute Slot Grid */}
              <div className="space-y-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  3. Choose Date & Available Slot
                </label>
                <CalendarPicker
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>Available start intervals:</span>
                    <span>5-minute station sanitization included</span>
                  </div>
                  <TimeSlotGrid
                    slots={availableSlots}
                    selectedSlot={selectedSlot}
                    onSelectSlot={setSelectedSlot}
                    isLoading={isLoadingSlots}
                  />
                </div>
              </div>

              {/* Step 4: Special Request / Notes */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  4. Note for Stylist (Optional)
                </label>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Any style preferences, scalp sensitivities, or product requests..."
                  rows={2}
                  className="w-full rounded-xl border border-neutral-200 bg-white p-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus-visible:border-neutral-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-900"
                />
              </div>
            </div>

            {/* Right Summary Sticky Card */}
            <div className="lg:col-span-5">
              <div className="sticky top-24">
                <BookingSummaryCard
                  salonName={store?.tenantName || 'Salon Bonanza'}
                  branchName={store?.branchName || 'Althan Branch'}
                  service={selectedService}
                  stylist={selectedStylist}
                  selectedDate={selectedDate}
                  selectedSlotTime={selectedSlot}
                  onConfirm={handleConfirmBooking}
                  isLoading={isSubmitting}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
