'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button, Input, Tabs } from '@/components/core';
import { 
  HelpCircle, 
  Search, 
  Clock, 
  ShieldCheck, 
  QrCode, 
  MapPin, 
  Phone, 
  ChevronDown, 
  ChevronUp, 
  ArrowLeft,
  Scissors
} from 'lucide-react';

interface FaqItem {
  id: string;
  category: 'cancellation' | 'booking' | 'passes' | 'surat';
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: '1',
    category: 'cancellation',
    question: 'How does the 2-Hour Cancellation Cutoff Policy work?',
    answer: 'Aura enforces a strict 2-hour cancellation policy to respect our stylists\' time and physical chair preparation. You can cancel or reschedule your reservation self-service without fees up until 2 hours before the start time. Within 2 hours, the chair is prepared and online cancellation is locked. In emergency situations, please call the salon front desk directly.',
  },
  {
    id: '2',
    category: 'cancellation',
    question: 'What happens when I cancel an appointment outside the 2-hour window?',
    answer: 'The appointment status immediately changes to CANCELLED in PostgreSQL, freeing the physical chair slot instantly for other waiting clients on the marketplace.',
  },
  {
    id: '3',
    category: 'booking',
    question: 'What is the Guaranteed Chair Reservation policy?',
    answer: 'Unlike traditional salon software that double-books stylists across walk-ins and phone calls, Aura guarantees that each client is assigned an exclusive physical chair station and stylist for their entire appointment window. Double-booking is strictly impossible on our platform.',
  },
  {
    id: '4',
    category: 'booking',
    question: 'Why is there a buffer time added to my appointment?',
    answer: 'Every haircut, coloring, or spa service includes dedicated station cleaning and preparation time to ensure your stylist is ready when you arrive. This ensures your stylist is 100% prepared when you arrive without running behind schedule.',
  },
  {
    id: '5',
    category: 'passes',
    question: 'Why are there no calendar invites or .ics emails sent?',
    answer: 'Per our minimalist design system, Aura is strictly in-app. Everything you need—including your unique QR pass code, arrival window, assigned chair station, and live 4-step delivery-style visual tracker—lives securely inside your account digital pass.',
  },
  {
    id: '6',
    category: 'passes',
    question: 'How do I check in upon arrival at the salon?',
    answer: 'Simply present your in-app Digital Reception Pass with QR code to the front desk reception tablet. The salon desk will scan your pass and immediately update your status to "In Progress".',
  },
  {
    id: '7',
    category: 'surat',
    question: 'Which areas in Surat do you currently cover?',
    answer: 'We currently feature premier verified salons across Althan (Milano Plaza), Adajan (River Palace, LP Savani Rd), and Vesu (Solitaire Business Hub). We are onboarding new ateliers in Piplod and City Light shortly.',
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [expandedId, setExpandedId] = React.useState<string | null>('1');

  const filteredFaqs = FAQ_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <section className="cal-grid-bg border-b border-neutral-200 py-16 text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>

          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-neutral-950">
            Aura Help & Concierge
          </h1>
          <p className="text-sm sm:text-base text-neutral-500 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about Surat salon bookings, chair guarantees, 2-hour cutoff policies, and contactless QR passes.
          </p>

          {/* Search Input */}
          <div className="mx-auto max-w-xl pt-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cancellation policy, chair guarantee, passes..."
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 shadow-xs focus-visible:border-neutral-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-900"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            { id: 'all', label: 'All FAQs' },
            { id: 'cancellation', label: '2-Hr Cancellation' },
            { id: 'booking', label: 'Chair & Slots' },
            { id: 'passes', label: 'QR Reception Pass' },
            { id: 'surat', label: 'Surat Locations' },
          ].map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* FAQs Accordion */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 p-12 text-center text-sm text-neutral-500">
              No matching answers found for "{searchQuery}". Try searching for "cancellation" or "chair".
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = expandedId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-xl border border-neutral-200 bg-white transition-all shadow-xs"
                >
                  <button
                    onClick={() => setExpandedId(isOpen ? null : faq.id)}
                    className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-neutral-900 hover:text-neutral-700"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-neutral-400 shrink-0 ml-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-neutral-400 shrink-0 ml-4" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="border-t border-neutral-100 px-5 pb-5 pt-3 text-xs text-neutral-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Salon Desk Support Contacts Card */}
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Central Support & Enquiries</p>
              <p className="text-sm font-bold text-neutral-900">
                General: <a href="mailto:contact@kaibuild.space" className="text-neutral-900 underline">contact@kaibuild.space</a> | Support: <a href="mailto:info@kaibuild.space" className="text-neutral-900 underline">info@kaibuild.space</a>
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 self-start sm:self-auto">
              24/7 Desk Active
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-lg font-bold text-neutral-900">
              Surat Outlet Desk Concierge
            </h3>
            <p className="text-xs text-neutral-500">
              Need urgent assistance within the 2-hour cancellation window? Contact your branch directly:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-1.5 shadow-xs">
              <p className="font-bold text-neutral-900">Althan Branch</p>
              <p className="text-neutral-500 text-[11px]">Milano Plaza, VIP Road</p>
              <p className="font-semibold text-neutral-800 flex items-center gap-1.5 pt-1">
                <Phone className="h-3.5 w-3.5 text-neutral-400" /> +91 261 489 0129
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-1.5 shadow-xs">
              <p className="font-bold text-neutral-900">Adajan Branch</p>
              <p className="text-neutral-500 text-[11px]">River Palace, LP Savani Rd</p>
              <p className="font-semibold text-neutral-800 flex items-center gap-1.5 pt-1">
                <Phone className="h-3.5 w-3.5 text-neutral-400" /> +91 261 489 0130
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-1.5 shadow-xs">
              <p className="font-bold text-neutral-900">Vesu Branch</p>
              <p className="text-neutral-500 text-[11px]">Solitaire Business Hub</p>
              <p className="font-semibold text-neutral-800 flex items-center gap-1.5 pt-1">
                <Phone className="h-3.5 w-3.5 text-neutral-400" /> +91 261 489 0131
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
