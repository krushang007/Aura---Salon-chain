'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, CheckCircle2, Sparkles, Store, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button, Input } from '@/components/core';

export default function PartnerRegisterPage() {
  const router = useRouter();
  const [salonName, setSalonName] = React.useState('');
  const [ownerName, setOwnerName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [locality, setLocality] = React.useState('Althan');
  const [address, setAddress] = React.useState('');
  const [phone, setPhone] = React.useState('+91 ');
  const [totalStylingChairs, setTotalStylingChairs] = React.useState(5);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/partner/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salonName,
          ownerName,
          email,
          password,
          locality,
          address,
          phone,
          totalStylingChairs,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to complete registration');
        setIsLoading(false);
        return;
      }

      router.push(data.redirectUrl || '/admin');
      router.refresh();
    } catch {
      setErrorMessage('Network connection error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="cal-grid-bg border-b border-neutral-200 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full bg-neutral-900 text-white px-3 py-1 text-xs font-semibold mb-3">
            <Store className="h-3.5 w-3.5" />
            Salon Partner Network
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950">
            Register Your Salon Store on Aura
          </h1>
          <p className="mt-2 text-sm sm:text-base text-neutral-500 max-w-2xl leading-relaxed">
            Eliminate double bookings with guaranteed physical chair allocations, zero calendar invites, and high-conversion client scheduling in Surat.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Form */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-xs">
              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-4">
                <Input
                  label="Salon Business Name"
                  placeholder="e.g. Belleza Luxury Atelier"
                  value={salonName}
                  onChange={(e) => setSalonName(e.target.value)}
                  required
                />

                <Input
                  label="Proprietor / Partner Name"
                  placeholder="e.g. Vikram Singhania"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Business Email"
                    type="email"
                    placeholder="contact@belleza.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <Input
                    label="Account Password"
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                      Surat Locality
                    </label>
                    <select
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 focus-visible:border-neutral-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-900"
                    >
                      <option value="Althan">Althan</option>
                      <option value="Adajan">Adajan</option>
                      <option value="Vesu">Vesu</option>
                      <option value="Piplod">Piplod</option>
                      <option value="City Light">City Light</option>
                      <option value="Pal">Pal</option>
                      <option value="Katargam">Katargam</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                      Physical Styling Chairs
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={totalStylingChairs}
                      onChange={(e) => setTotalStylingChairs(Number(e.target.value))}
                      className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 focus-visible:border-neutral-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-900"
                      required
                    />
                  </div>
                </div>

                <Input
                  label="Store Address"
                  placeholder="Shop 104, Milano Plaza, VIP Road"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />

                <Input
                  label="Contact Phone"
                  placeholder="+91 261 489 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-4"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Launch Partner Portal
              </Button>

              <p className="text-center text-xs text-neutral-500 pt-2">
                Already registered with Aura?{" "}
                <Link href="/login" className="font-semibold text-neutral-900 hover:underline">
                  Sign in to Partner Admin
                </Link>
              </p>
            </form>
          </div>

          {/* Right Benefits Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-6 space-y-4">
              <h3 className="font-display text-base font-bold text-neutral-900">
                Why Top Surat Salons Choose Aura
              </h3>
              
              <div className="space-y-4 text-xs text-neutral-600">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-neutral-900">Zero Overbooking Guarantee</p>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      Postgres GiST exclusion prevents double-booking of stations and stylists automatically.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-neutral-900">Zero Calendar Invite Friction</p>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      No spammy .ics emails or sync clashes. Pure in-app digital passes with QR check-in.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-neutral-900">Protected 2-Hr Cancellation Window</p>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      Prevent last-minute drop-offs and keep stylist chairs continuously productive.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center space-y-2">
              <p className="text-xs text-neutral-400">Need personalized enterprise onboarding?</p>
              <p className="text-sm font-semibold text-neutral-900">Call Concierge: +91 261 489 0129</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
