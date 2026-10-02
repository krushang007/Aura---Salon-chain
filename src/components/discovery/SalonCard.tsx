import * as React from 'react';
import Link from 'next/link';
import { Card, Button, Badge } from '@/components/core';
import { MapPin, Clock, Armchair, ArrowRight, ShieldCheck } from 'lucide-react';
import { SalonStoreSummary } from './types';

export function SalonCard({ store }: { store: SalonStoreSummary }) {
  return (
    <Card className="group overflow-hidden rounded-2xl border border-neutral-200 transition-all hover:border-neutral-300 hover:shadow-md flex flex-col justify-between h-full">
      <div className="p-6 flex flex-col h-full justify-between">
        <div className="space-y-4">
          {/* Top Badges */}
          <div className="flex items-center justify-between">
            <Badge variant="neutral">
              {store.locality}, Surat
            </Badge>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
              <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-700">
                <ShieldCheck className="h-3 w-3 text-neutral-600" />
                Verified Salon
              </span>
            </div>
          </div>

          {/* Title */}
          <div>
            <h3 className="font-display text-lg font-bold text-neutral-900 group-hover:text-neutral-700 transition-colors">
              {store.branchName}
            </h3>
            <p className="mt-1 flex items-start gap-1.5 text-xs text-neutral-500 leading-normal">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-400 mt-0.5" />
              <span className="line-clamp-1">{store.address}</span>
            </p>
          </div>

          {/* Operational Highlights */}
          <div className="grid grid-cols-2 gap-2 border-y border-neutral-100 py-3 text-xs text-neutral-600">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-neutral-400" />
              <span>
                {store.openingTime.slice(0, 5)} - {store.closingTime.slice(0, 5)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Armchair className="h-3.5 w-3.5 text-neutral-400" />
              <span>{store.totalStylingChairs} Active Chairs</span>
            </div>
          </div>

          {/* Featured Service Preview (Consistent Height) */}
          <div className="flex min-h-[54px] items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-xs">
            {store.featuredService ? (
              <>
                <div className="truncate pr-2">
                  <p className="font-medium text-neutral-800 truncate">{store.featuredService.title}</p>
                  <p className="text-[11px] text-neutral-400">{store.featuredService.durationMinutes} mins</p>
                </div>
                <p className="font-bold text-neutral-900 shrink-0">₹{store.featuredService.price}</p>
              </>
            ) : (
              <div className="flex items-center justify-between w-full text-neutral-500">
                <span className="font-medium">Full Service Atelier</span>
                <span className="text-[11px] text-neutral-400">View Catalog</span>
              </div>
            )}
          </div>
        </div>

        {/* CTA (Pinned to bottom) */}
        <div className="mt-5 pt-3 border-t border-neutral-100">
          <Link href={`/book/${store.id}`}>
            <Button variant="primary" size="md" className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Book Appointment
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
