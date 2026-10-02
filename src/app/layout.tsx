import type { Metadata } from 'next';
import './globals.css';
import { Navbar, Footer } from '@/components/core';
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Aura — Surat Salon & Wellness Marketplace',
  description: 'Instant, real-time appointment booking across premier salons in Surat. Zero calendar invites, 2-hour cancellation cutoff, and live delivery-style tracking.',
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
        <Navbar user={user} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
