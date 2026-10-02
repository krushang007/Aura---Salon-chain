import type { Metadata } from 'next';
import './globals.css';
import { Navbar, Footer, ToastProvider } from '@/components/core';
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://kaibuild.space'),
  title: {
    default: 'Aura — Surat Premier Salon & Wellness Marketplace',
    template: '%s | Aura Salon Marketplace',
  },
  description: 'Instant, real-time appointment booking across premier luxury salons in Surat. Guaranteed chair allocation, zero overbooking, dedicated station prep, and live appointment delivery tracking.',
  keywords: ['Salon Surat', 'Haircut Booking Surat', 'Luxury Salon Althan', 'Beauty Spa Surat', 'Salon Appointment Booking'],
  authors: [{ name: 'Aura Styling Team', url: 'https://kaibuild.space' }],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://kaibuild.space',
    title: 'Aura — Surat Premier Salon & Wellness Marketplace',
    description: 'Instant real-time chair reservation across premier salons in Surat with zero overbooking.',
    siteName: 'Aura Salon Marketplace',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aura — Surat Premier Salon Marketplace',
    description: 'Guaranteed chair reservation across luxury salons in Surat.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
