import * as React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white py-12 text-sm text-neutral-500">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <p className="font-semibold text-neutral-900">
              Aura Salon & Wellness Marketplace
            </p>
            <p className="text-xs text-neutral-400">
              The real-time appointment network for premier salons in Surat, Gujarat.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs">
            <Link href="/privacy" className="hover:text-neutral-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-neutral-900 transition-colors">
              Terms of Service
            </Link>
            <Link href="/help" className="hover:text-neutral-900 transition-colors">
              Help Center
            </Link>
            <Link href="/partner-register" className="font-medium text-neutral-900 hover:underline">
              Partner with Aura (Salon Store Registration)
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-neutral-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
          <div>
            Contact: <a href="mailto:contact@kaibuild.space" className="text-neutral-600 hover:text-neutral-900 underline">contact@kaibuild.space</a> | Sales: <a href="mailto:sales@kaibuild.space" className="text-neutral-600 hover:text-neutral-900 underline">sales@kaibuild.space</a>
          </div>
          © {new Date().getFullYear()} Aura Technologies, Inc. All rights reserved. Zero calendar invites. Strictly in-app appointments.
        </div>
      </div>
    </footer>
  );
}
