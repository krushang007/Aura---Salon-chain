import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, CalendarX } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Aura Salon & Wellness Marketplace",
  description: "Learn how Aura protects your appointment data and personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="cal-grid-bg border-b border-neutral-200 py-16 text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Salons
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-800">
            <Shield className="h-3.5 w-3.5 text-neutral-700" />
            Data Protection Standard
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-neutral-950">
            Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-neutral-500 max-w-2xl mx-auto leading-relaxed">
            Effective Date: October 2026. Learn how Aura securely handles your salon bookings, guest profiles, and personal data.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-neutral-700 text-sm leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold text-neutral-900">1. Information We Collect</h2>
          <p>
            When you browse, register, or schedule an appointment on Aura, we collect only the necessary details required to guarantee your salon experience:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
            <li><strong>Account Identity:</strong> Your full name, email address, and optional phone number.</li>
            <li><strong>Appointment Preferences:</strong> Selected salon branch, stylist selection, appointment date/time, and custom stylist notes (e.g. skin allergies, product preferences).</li>
            <li><strong>Authentication Data:</strong> Secure salted PBKDF2 password hashes or OAuth tokens exchanged via Supabase with Google.</li>
          </ul>
        </section>

        <section className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-6">
          <div className="flex items-center gap-2 font-display text-base font-bold text-neutral-900">
            <CalendarX className="h-5 w-5 text-neutral-700" />
            Zero External Calendar Leakage Guarantee
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            To prevent calendar sync pollution, calendar snooping, and accidental public calendar indexing, Aura operates on an in-app digital pass model. We never push your appointments into third-party shared calendars or send raw .ics calendar invite attachments without explicit authorization.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold text-neutral-900">2. How We Use Your Information</h2>
          <p>We process your data strictly to execute our core marketplace services:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
            <li>Allocating guaranteed physical styling chairs in real-time.</li>
            <li>Generating tamper-proof QR check-in passes for salon front desks.</li>
            <li>Sending in-app status updates (e.g. check-in confirmations, completion receipts).</li>
            <li>Empowering salon managers with accurate daily staff utilization analytics.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold text-neutral-900">3. Data Security & Storage</h2>
          <p>
            All network communication is strictly encrypted over TLS 1.3. Sessions are managed using tamper-proof cryptographic HMAC signatures with HTTP-only, SameSite cookies. Database storage is protected by Row Level Security (RLS) policies within our high-availability PostgreSQL infrastructure.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold text-neutral-900">4. Your Rights & Deletion</h2>
          <p>
            You retain full ownership of your data. You may inspect or update your profile details at any time from your account settings. For full account deletion or data export requests, please contact our concierge desk at <a href="mailto:privacy@kaibuild.space" className="text-neutral-900 font-semibold underline">privacy@kaibuild.space</a>.
          </p>
        </section>
      </article>
    </div>
  );
}
