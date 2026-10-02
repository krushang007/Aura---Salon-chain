import * as React from 'react';
import { cn } from '@/lib/utils';
import { QrCode } from 'lucide-react';

export function QrCodeView({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs text-center',
        className
      )}
    >
      <div className="flex h-36 w-36 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 p-2">
        {/* Render a crisp geometric SVG QR code placeholder matching Aura pass */}
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full text-neutral-900"
          fill="currentColor"
        >
          {/* Outer corner 1 */}
          <rect x="10" y="10" width="25" height="25" rx="3" />
          <rect x="15" y="15" width="15" height="15" fill="#fff" />
          <rect x="18" y="18" width="9" height="9" />
          {/* Outer corner 2 */}
          <rect x="65" y="10" width="25" height="25" rx="3" />
          <rect x="70" y="15" width="15" height="15" fill="#fff" />
          <rect x="73" y="18" width="9" height="9" />
          {/* Outer corner 3 */}
          <rect x="10" y="65" width="25" height="25" rx="3" />
          <rect x="15" y="70" width="15" height="15" fill="#fff" />
          <rect x="18" y="73" width="9" height="9" />
          {/* Dense data modules */}
          <rect x="42" y="12" width="6" height="6" />
          <rect x="52" y="12" width="6" height="12" />
          <rect x="42" y="24" width="6" height="12" />
          <rect x="52" y="30" width="6" height="6" />
          <rect x="12" y="42" width="12" height="6" />
          <rect x="30" y="42" width="6" height="12" />
          <rect x="42" y="42" width="16" height="16" />
          <rect x="65" y="42" width="10" height="6" />
          <rect x="80" y="42" width="8" height="12" />
          <rect x="42" y="65" width="6" height="10" />
          <rect x="52" y="65" width="12" height="6" />
          <rect x="68" y="65" width="20" height="10" />
          <rect x="42" y="80" width="12" height="8" />
          <rect x="65" y="80" width="10" height="8" />
          <rect x="80" y="80" width="8" height="8" />
        </svg>
      </div>
      <p className="mt-3 font-mono text-xs font-semibold tracking-wider text-neutral-800 uppercase">
        {code}
      </p>
      <p className="mt-1 text-[11px] text-neutral-400">
        Scan at reception counter upon arrival for contactless self-check-in
      </p>
    </div>
  );
}
