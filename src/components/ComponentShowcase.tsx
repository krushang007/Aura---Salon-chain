'use client';

import * as React from 'react';
import {
  Button,
  Input,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  StatusBadge,
  LiveTracker,
  QrCodeView,
  CalendarPicker,
  TimeSlotGrid,
  Select,
} from '@/components/core';
import { SignInCard } from '@/components/auth';
import { SalonCard } from '@/components/discovery';
import { StylistSelector, BookingSummaryCard } from '@/components/booking';
import { DigitalPassCard, BookingHistoryList } from '@/components/appointments';
import { DailyRosterView, QuickWalkinModal } from '@/components/staff';
import { AddStaffModal, StaffManagementTable } from '@/components/admin';

export function ComponentShowcase() {
  const [selectedDate, setSelectedDate] = React.useState('2026-10-02');
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>('14:30');
  const [isAddStaffOpen, setIsAddStaffOpen] = React.useState(false);
  const [isQuickBookOpen, setIsQuickBookOpen] = React.useState(false);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
      {/* Page Header */}
      <div className="border-b border-neutral-200 pb-6">
        <span className="rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-800">
          Aura Minimalist Design System
        </span>
        <h1 className="font-display text-3xl font-bold tracking-tight text-neutral-900 mt-2 sm:text-4xl">
          Aura Marketplace Component Portfolio
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Production-grade UI primitives and domain orchestrators strictly adhering to Aura minimalism, 0 role tabs, 0 calendar invites, 2-hour cancellation rules, and 0 VIP badges.
        </p>
      </div>

      {/* 1. Core Primitives */}
      <section className="space-y-6">
        <h2 className="font-display text-xl font-bold text-neutral-900 border-b pb-2">
          1. Core Primitives (Buttons, Badges, Inputs, Status)
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary Solid (#111111)</Button>
          <Button variant="secondary">Secondary Neutral</Button>
          <Button variant="outline">Outline Hairline</Button>
          <Button variant="subtle">Subtle</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="primary" isLoading>Loading State</Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral">Neutral Standard</Badge>
          <Badge variant="success" dot>Confirmed Slot</Badge>
          <Badge variant="warning" dot>In Service</Badge>
          <Badge variant="destructive" dot>Cancelled</Badge>
          <StatusBadge status="CONFIRMED" />
          <StatusBadge status="IN_PROGRESS" />
          <StatusBadge status="COMPLETED" />
          <StatusBadge status="RESCHEDULE_NEEDED" />
        </div>
      </section>

      {/* 2. Live Delivery-Style Status Timeline */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-neutral-900 border-b pb-2">
          2. Live Delivery-Style Visual Tracker (Pair 04 & Pair 10)
        </h2>
        <LiveTracker status="CONFIRMED" />
        <LiveTracker status="IN_PROGRESS" />
      </section>

      {/* 3. Slot Booking Engine Primitives */}
      <section className="space-y-6">
        <h2 className="font-display text-xl font-bold text-neutral-900 border-b pb-2">
          3. Slot Engine (Calendar Strip & 15-Min Slots)
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <CalendarPicker selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          </div>
          <div className="lg:col-span-6 space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600">
              Available 15-min Intervals (with 5-min prep buffer)
            </label>
            <TimeSlotGrid
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
              slots={[
                { time: '14:00', display: '2:00 PM', isAvailable: true },
                { time: '14:30', display: '2:30 PM', isAvailable: true },
                { time: '15:00', display: '3:00 PM', isAvailable: false, bookedReason: 'Stylist engaged' },
                { time: '15:30', display: '3:30 PM', isAvailable: true },
                { time: '16:00', display: '4:00 PM', isAvailable: true },
                { time: '16:30', display: '4:30 PM', isAvailable: false, bookedReason: 'Lunch / Break' },
              ]}
            />
          </div>
        </div>
      </section>

      {/* 4. Unified Authentication Preview */}
      <section className="space-y-6">
        <h2 className="font-display text-xl font-bold text-neutral-900 border-b pb-2">
          4. Unified Sign-in Form (Pair 01 - 0 Role Tabs)
        </h2>
        <SignInCard onSubmit={async (d) => console.log('Login:', d)} />
      </section>

      {/* Modals demo triggers */}
      <div className="flex gap-4">
        <Button variant="primary" onClick={() => setIsAddStaffOpen(true)}>
          Preview Add Staff Modal (abc@gmail.com)
        </Button>
        <Button variant="outline" onClick={() => setIsQuickBookOpen(true)}>
          Preview Walk-in Quick Booking Modal
        </Button>
      </div>

      <AddStaffModal
        isOpen={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
        salonName="Salon Bonanza"
        stores={[
          { id: '1', name: 'Salon Bonanza — Althan Branch' },
          { id: '2', name: 'Salon Bonanza — Adajan Branch' },
        ]}
        onSubmit={async (data) => console.log('Add Staff:', data)}
      />

      <QuickWalkinModal
        isOpen={isQuickBookOpen}
        onClose={() => setIsQuickBookOpen(false)}
        storeId="1"
        staffId="s1"
        stylistName="Rahul Mehta"
        services={[
          { id: '1', title: 'Signature Precision Haircut', price: 850, durationMinutes: 45 },
          { id: '2', title: 'Beard Sculpt & Hot Towel', price: 450, durationMinutes: 30 },
        ]}
        onSubmit={async (data) => console.log('Quick Walk-in:', data)}
      />
    </div>
  );
}
