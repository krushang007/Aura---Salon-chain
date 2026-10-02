'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button, StatusBadge, Badge, Tabs } from '@/components/core';
import { Calendar, Clock, AlertTriangle, CheckCircle2, ChevronRight, Phone } from 'lucide-react';
import { BookingHistoryItem } from './types';

export interface BookingHistoryListProps {
  upcomingBookings: BookingHistoryItem[];
  pastVisits: BookingHistoryItem[];
  onCancel: (id: string) => void;
  onReschedule: (id: string) => void;
}

export function BookingHistoryList({
  upcomingBookings,
  pastVisits,
  onCancel,
  onReschedule,
}: BookingHistoryListProps) {
  const [activeTab, setActiveTab] = React.useState('upcoming');

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <Tabs
        activeId={activeTab}
        onChange={setActiveTab}
        items={[
          { id: 'upcoming', label: 'Upcoming Appointments', badge: upcomingBookings.length },
          { id: 'past', label: 'Past Visits', badge: pastVisits.length },
        ]}
      />

      {/* Tab: Upcoming Appointments */}
      {activeTab === 'upcoming' && (
        <div className="space-y-4">
          {upcomingBookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 p-8 text-center">
              <Calendar className="mx-auto h-8 w-8 text-neutral-400" />
              <p className="mt-2 text-sm font-semibold text-neutral-800">No upcoming appointments</p>
              <p className="text-xs text-neutral-400 mt-0.5">Explore Surat salons to schedule your next visit.</p>
              <Link href="/">
                <Button size="sm" variant="primary" className="mt-4">
                  Explore Salons
                </Button>
              </Link>
            </div>
          ) : (
            upcomingBookings.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-4">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.status} />
                    <span className="font-mono text-xs text-neutral-400">ID: #{item.id.slice(0, 8)}</span>
                  </div>
                  <span className="text-[11px] font-medium text-neutral-500">
                    {item.canCancelOnline ? (
                      <span className="text-emerald-700">✓ Self-modification window active (&gt;2 hrs)</span>
                    ) : (
                      <span className="text-amber-700">⚠ Within 2-hr cutoff (Locked)</span>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-8 space-y-2">
                    <h3 className="font-display text-lg font-bold text-neutral-900">
                      {item.salonAndBranch}
                    </h3>
                    <p className="text-sm font-medium text-neutral-700">
                      {item.serviceTitle} — ₹{item.price}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      <span>👤 {item.stylistName}</span>
                      <span>🕒 {item.dateFormatted}</span>
                    </div>

                    {!item.canCancelOnline && (
                      <div className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800 border border-amber-200 mt-2 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                        <span>
                          Cancellation & reschedule locked: Within 2-hour cutoff. Salon slot and chairs are prepared.
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-4 flex flex-col gap-2">
                    <Link href={`/appointments/${item.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Digital Pass & QR
                      </Button>
                    </Link>

                    {item.canCancelOnline ? (
                      <button
                        onClick={() => onCancel(item.id)}
                        className="text-center text-xs font-semibold text-neutral-600 hover:text-red-600 transition-colors py-1.5"
                      >
                        Cancel Appointment (Frees slot immediately)
                      </button>
                    ) : (
                      <button
                        disabled
                        className="text-center text-xs font-medium text-neutral-400 cursor-not-allowed py-1.5"
                      >
                        Cancellation Locked (&lt;2 hrs)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Past Visits */}
      {activeTab === 'past' && (
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Salon & Branch</th>
                  <th className="px-5 py-3">Stylist</th>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-800">
                {pastVisits.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium whitespace-nowrap">{item.dateFormatted}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-semibold">{item.salonAndBranch}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">{item.stylistName}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">{item.serviceTitle}</td>
                    <td className="px-5 py-3.5 font-bold whitespace-nowrap">₹{item.price}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <Button variant="outline" size="sm">
                        Re-book Service
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
