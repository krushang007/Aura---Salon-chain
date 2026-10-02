'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { SignInCard } from '@/components/auth';
import { SignInFormData } from '@/components/auth/types';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

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

      // Success: redirect based on automatic role detection
      router.push(result.redirectUrl || '/');
      router.refresh();
    } catch (err) {
      setErrorMessage('Network connection error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="cal-grid-bg flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 sm:p-6 lg:p-8">
      <SignInCard
        onSubmit={handleSignIn}
        isLoading={isLoading}
        errorMessage={errorMessage}
      />
    </div>
  );
}
