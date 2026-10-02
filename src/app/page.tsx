'use client';

import * as React from 'react';
import { SalonCard, SalonFilters } from '@/components/discovery';
import { SalonStoreSummary, DiscoveryFilters } from '@/components/discovery/types';
import { Sparkles, MapPin, ShieldCheck, Clock } from 'lucide-react';

export default function HomePage() {
  const [stores, setStores] = React.useState<SalonStoreSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [filters, setFilters] = React.useState<DiscoveryFilters>({
    locality: '',
    category: '',
    searchQuery: '',
  });

  const fetchStores = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const url = filters.locality
        ? `/api/discovery/salons?locality=${encodeURIComponent(filters.locality)}`
        : '/api/discovery/salons';
      const res = await fetch(url);
      const data = await res.json();
      setStores(data.stores || []);
    } catch (err) {
      console.error('Error fetching salons:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters.locality]);

  React.useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const filteredStores = React.useMemo(() => {
    if (!filters.searchQuery) return stores;
    const q = filters.searchQuery.toLowerCase();
    return stores.filter(
      (s) =>
        s.branchName.toLowerCase().includes(q) ||
        s.locality.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.featuredService?.title.toLowerCase().includes(q)
    );
  }, [stores, filters.searchQuery]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section (Aura Minimalist SaaS Aesthetic) */}
      <section className="cal-grid-bg border-b border-neutral-200 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-800 shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Marketplace in Surat, Gujarat
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-neutral-950 max-w-3xl mx-auto">
            Book top salon stylists with guaranteed chair seats.
          </h1>

          <p className="text-base sm:text-lg text-neutral-500 max-w-2xl mx-auto leading-relaxed">
            Real-time appointment schedule network across premier ateliers in Althan, Adajan, and Vesu. Zero double-booking, 2-hour free cancellation, and strictly in-app digital passes.
          </p>

          {/* Value Props Bar */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-600 font-medium">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-neutral-800" />
              <span>Real-Time Slot Locks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-neutral-800" />
              <span>5-Min Sanitization Buffers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-neutral-800" />
              <span>Surat Verified Ateliers</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog & Filter Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-neutral-900">
              Explore Salons in Surat
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Select a location to browse available stylists, services, and live appointment slots.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <SalonFilters filters={filters} onChange={setFilters} />

        {/* Grid of Salons */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 animate-pulse rounded-2xl bg-neutral-100" />
            ))}
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 p-12 text-center text-neutral-500">
            No salons found matching your criteria. Try switching locality filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map((store) => (
              <SalonCard key={store.id} store={store} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
