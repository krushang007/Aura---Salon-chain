'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, KeyRound, CheckCircle2, Phone, Mail, ArrowRight } from 'lucide-react';
import { Button, Input } from '@/components/core';

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('');
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate secure reset link dispatch
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 600);
  };

  return (
    <div className="cal-grid-bg flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-xs space-y-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sign In
        </Link>

        <div className="space-y-2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 mb-1">
            <KeyRound className="h-5 w-5" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-900">
            Reset Password
          </h1>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Enter your registered email address. We will verify your account and provide reset instructions.
          </p>
        </div>

        {isSubmitted ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Reset Instructions Dispatched
            </div>
            <p className="text-xs text-emerald-700 leading-relaxed">
              If an Aura account exists for <strong>{email}</strong>, you will receive self-service verification steps shortly.
            </p>
            <div className="pt-2">
              <Link href="/login" className="inline-block">
                <Button size="sm" variant="primary">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Registered Email"
              type="email"
              placeholder="sarah@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Send Reset Link
            </Button>
          </form>
        )}

        <div className="border-t border-neutral-100 pt-4 text-center">
          <p className="text-xs text-neutral-400">
            Stylist or Salon Admin with urgent salon floor access?{" "}
            <a href="tel:+912614890129" className="text-neutral-700 font-semibold hover:underline">
              Contact Desk Concierge
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
