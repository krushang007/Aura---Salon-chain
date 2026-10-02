import type { Metadata } from 'next';
import './globals.css';
import { Navbar, Footer, ToastProvider } from '@/components/core';
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Aura — Surat Salon & Wellness Marketplace',
  description: 'Instant, real-time appointment booking across premier salons in Surat. Guaranteed chair allocation, 2-hour cancellation cutoff, and live status tracking.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-white text-neutral-900 antialiased font-sans">
        <ToastProvider>
          <Navbar user={user} />
          <main className="flex-1">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
