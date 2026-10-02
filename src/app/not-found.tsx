import Link from 'next/link';
import { Button } from '@/components/core';
import { Compass, ArrowLeft, Home, Calendar } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="cal-grid-bg flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto max-w-md space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-900 border border-neutral-200 shadow-2xs">
          <Compass className="h-8 w-8 text-neutral-800 animate-spin-slow" />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-xs font-bold tracking-wider text-neutral-400 uppercase">
            404 Error • Page Not Found
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950">
            We lost this salon chair
          </h1>
          <p className="text-sm text-neutral-500 leading-relaxed max-w-sm mx-auto">
            The page or salon reservation URL you requested could not be located in our Surat directory. It might have been moved or rescheduled.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Home className="h-4 w-4" />}
            >
              Back to Salons
            </Button>
          </Link>
          <Link href="/appointments">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Calendar className="h-4 w-4" />}
            >
              My Appointments
            </Button>
          </Link>
        </div>

        <div className="border-t border-neutral-200/80 pt-6 text-xs text-neutral-400">
          Need immediate concierge assistance? Contact{' '}
          <a href="tel:+912612458899" className="font-medium text-neutral-700 hover:underline">
            +91 261 245 8899
          </a>
        </div>
      </div>
    </div>
  );
}
