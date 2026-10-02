'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/core';
import { ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone, password }),
      });

      const result = await res.json();
      if (!res.ok) {
        setErrorMessage(result.error || 'Failed to create account');
        setIsLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setErrorMessage('Network connection error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="cal-grid-bg flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-xs">
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-900">
            Create an Aura Account
          </h1>
          <p className="text-xs text-neutral-500">
            One account to discover, schedule, and manage salon appointments across Surat.
          </p>
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Sarah Jenkins"
            required
          />

          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sarah@example.com"
            required
          />

          <Input
            label="Mobile Number (Optional)"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98250 12345"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Create Customer Account
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-neutral-500">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-neutral-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
