'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core';
import { ArrowRight, Calendar, CheckCircle2, ShieldCheck } from 'lucide-react';
import { SignInFormData } from './types';

export interface SignInCardProps {
  onSubmit: (data: SignInFormData) => Promise<void>;
  isLoading?: boolean;
  errorMessage?: string | null;
}

export function SignInCard({ onSubmit, isLoading = false, errorMessage }: SignInCardProps) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ email, password, rememberMe });
  };

  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 items-center gap-12 lg:grid-cols-12">
      {/* Left Column: Unified Sign-In Form */}
      <div className="lg:col-span-7">
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-xs">
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              Sign in to Aura
            </h1>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Enter your credentials to access your account. Customer, Stylist, or Salon Partner role is automatically recognized upon sign-in.
            </p>
          </div>

          {errorMessage && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@example.com"
              required
              autoComplete="email"
            />

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
                className="mt-1.5 flex h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:border-neutral-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-900"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
              />
              <label htmlFor="rememberMe" className="text-xs text-neutral-600 select-none cursor-pointer">
                Keep me signed in for 30 days
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Sign In to Aura
            </Button>
          </form>

          <div className="mt-6 space-y-2 border-t border-neutral-100 pt-4 text-xs">
            <p className="text-neutral-500">
              New customer?{' '}
              <Link href="/register" className="font-semibold text-neutral-900 hover:underline">
                Create an account
              </Link>
            </p>
            <p className="text-neutral-500">
              Partner with Aura?{' '}
              <Link href="/partner-register" className="font-semibold text-neutral-900 hover:underline">
                Register your Salon Store
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Live Booking Preview Card (Aura showcase) */}
      <div className="hidden lg:col-span-5 lg:block">
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50/50 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700">
              <Calendar className="h-4 w-4 text-neutral-400" />
              Live Booking Preview
            </div>
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200 uppercase">
              Confirmed
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
              Salon & Location
            </p>
            <p className="text-sm font-semibold text-neutral-900">
              Salon Bonanza — Althan Branch, Surat
            </p>
            <p className="text-xs text-neutral-500">4.9 ★ (142 reviews)</p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-3.5 space-y-2 shadow-xs">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
                Service
              </p>
              <p className="text-sm font-semibold text-neutral-900">
                Signature Precision Haircut & Styling
              </p>
              <p className="text-xs text-neutral-500">45 min • ₹850</p>
            </div>
            <div className="border-t border-neutral-100 pt-2 text-xs text-neutral-600 space-y-1">
              <p>👤 Rahul Mehta • Master Stylist (Chair 03)</p>
              <p>🕒 Today at 3:30 PM (IST)</p>
            </div>
          </div>

          <p className="text-[11px] text-neutral-400 leading-relaxed text-center">
            Need assistance scheduling or claiming a stylist seat?{' '}
            <span className="text-neutral-700 font-medium underline cursor-pointer">
              Contact concierge
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
