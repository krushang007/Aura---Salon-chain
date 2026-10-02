'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SignInCard } from '@/components/auth';
import { SignInFormData } from '@/components/auth/types';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || searchParams.get('next');
  const errorParam = searchParams.get('error');

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(
    errorParam === 'auth_failed'
      ? 'Authentication failed. Please verify your credentials or try again.'
      : null
  );

  const handleSignIn = async (data: SignInFormData) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setErrorMessage(result.error || 'Invalid credentials');
        setIsLoading(false);
        return;
      }

      // Success: redirect based on explicit return target or role detection
      if (redirectParam && redirectParam.startsWith('/') && redirectParam !== '/login') {
        router.push(redirectParam);
      } else {
        router.push(result.redirectUrl || '/');
      }
      router.refresh();
    } catch {
      setErrorMessage('Network connection error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <SignInCard
      onSubmit={handleSignIn}
      isLoading={isLoading}
      errorMessage={errorMessage}
      redirectUrl={redirectParam || undefined}
    />
  );
}

export default function LoginPage() {
  return (
    <div className="cal-grid-bg flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 sm:p-6 lg:p-8">
      <React.Suspense fallback={<div className="text-sm text-neutral-400">Loading sign in...</div>}>
        <LoginForm />
      </React.Suspense>
    </div>
  );
}
