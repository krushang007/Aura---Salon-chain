import * as React from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Clock, AlertTriangle, Armchair } from "lucide-react";

export const metadata = {
  title: "Terms of Service | Aura Salon & Wellness Marketplace",
  description: "Terms and conditions governing the Aura salon booking platform and partner policies.",
};

export default function TermsPage() {
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
            <FileText className="h-3.5 w-3.5 text-neutral-700" />
            Platform Agreement
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-neutral-950">
            Terms of Service
          </h1>
          <p className="text-sm sm:text-base text-neutral-500 max-w-2xl mx-auto leading-relaxed">
            Please read these terms carefully before scheduling services with partner salons across Surat.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-neutral-700 text-sm leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold text-neutral-900">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Aura web application, booking appointment slots, or onboarding as a salon partner, you agree to be bound by these Terms of Service. If you do not agree, you may not use our marketplace.
          </p>
        </section>

        <section className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-6">
          <div className="flex items-center gap-2 font-display text-base font-bold text-amber-900">
            <Clock className="h-5 w-5 text-amber-700" />
            2. The 2-Hour Strict Cancellation Cutoff Policy
          </div>
          <p className="text-xs text-amber-950/80 leading-relaxed">
            To respect the time of stylists and protect physical chair availability, self-service cancellations and reschedules are permitted up to <strong>2 hours prior to your scheduled start time</strong>. Within the 2-hour window, appointments are mathematically locked and can only be modified in extraordinary cases by phoning the salon front desk directly.
          </p>
        </section>

        <section className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-6">
          <div className="flex items-center gap-2 font-display text-base font-bold text-neutral-900">
            <Armchair className="h-5 w-5 text-neutral-700" />
            3. Physical Chair Allocation & Zero Overbooking Guarantee
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Aura enforces physical station capacity limits at every branch. Our PostgreSQL exclusion constraints prevent double-booking of any stylist or station chair. When your booking is confirmed, a specific physical chair station is exclusively reserved for your session interval.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold text-neutral-900">4. Arrival & Digital Reception Pass</h2>
          <p>
            Clients must present their in-app QR Digital Reception Pass at the salon front desk upon arrival. If you arrive more than 15 minutes past your scheduled start time without prior notice, the salon reserves the right to declare a no-show and re-allocate the chair to walk-in patrons.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold text-neutral-900">5. Salon Partner Obligations</h2>
          <p>
            Salons partnering with Aura agree to maintain clean station hygiene, adhere to scheduled appointment intervals, honor booked pricing without unannounced surcharges, and keep stylist rosters and chair availability up to date on the platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold text-neutral-900">6. Contact & Dispute Resolution</h2>
          <p>
            For inquiries or dispute assistance regarding any salon booking in Surat, please reach out to our platform support team at <a href="mailto:support@aurasalon.in" className="text-neutral-900 font-semibold underline">support@aurasalon.in</a>.
          </p>
        </section>
      </article>
    </div>
  );
}
