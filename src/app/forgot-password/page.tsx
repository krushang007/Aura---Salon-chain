'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, KeyRound, CheckCircle2, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import { Button, Input, useToast } from '@/components/core';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = React.useState('');
  const [step, setStep] = React.useState<'email' | 'verify' | 'done'>('email');
  const [code, setCode] = React.useState('4892');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleRequestCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setStep('verify');
      toast.info('Instant security code generated: 4892', 'Verification Ready');
    }, 400);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to reset password');
        setIsLoading(false);
        return;
      }

      setStep('done');
      toast.success('Your password has been reset successfully.', 'Password Updated');
    } catch {
      setErrorMessage('Network connection error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="cal-grid-bg flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
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
            {step === 'done' ? 'Password Updated' : step === 'verify' ? 'Create New Password' : 'Reset Password'}
          </h1>
          <p className="text-xs text-neutral-500 leading-relaxed">
            {step === 'verify'
              ? `Enter the instant security passcode and choose your new password for ${email}.`
              : 'Direct self-service account recovery for Aura customers and stylists.'}
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700">
            {errorMessage}
          </div>
        )}

        {step === 'done' ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Credentials Updated
            </div>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Your password has been changed. You can now sign in to Aura with your updated credentials.
            </p>
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => router.push('/login')}
            >
              Proceed to Sign In
            </Button>
          </div>
        ) : step === 'verify' ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 flex items-center justify-between text-xs">
              <span className="text-neutral-500 font-medium">Instant Security Passcode:</span>
              <span className="font-mono font-bold text-neutral-900 bg-white border px-2 py-0.5 rounded-md">
                4892
              </span>
            </div>

            <Input
              label="4-Digit Passcode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="4892"
              required
            />

            <Input
              label="New Password"
              type="password"
              placeholder="•••••••••••• (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              Update Password
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <Input
              label="Registered Email Address"
              type="email"
              placeholder="contact@kaibuild.space"
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
              Verify Account
            </Button>
          </form>
        )}

        {/* Staff Assistance Notice */}
        <div className="border-t border-neutral-100 pt-4 space-y-2 text-center text-xs text-neutral-400">
          <div className="flex items-center justify-center gap-1.5 text-neutral-600 font-medium">
            <UserCheck className="h-3.5 w-3.5" />
            <span>Stylist or Salon Staff Member?</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            Your account was provisioned by your Salon Admin. You can also request an instant password reset directly from your salon administrator without delay.
          </p>
        </div>
      </div>
    </div>
  );
}
