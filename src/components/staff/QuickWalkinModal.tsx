'use client';

import * as React from 'react';
import { Modal, Button, Input, Select } from '@/components/core';
import { PlusCircle, Search, UserCheck, X } from 'lucide-react';
import { QuickWalkinInput } from './types';

export interface QuickWalkinModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  staffId: string;
  stylistName: string;
  services: { id: string; title: string; price: number; durationMinutes: number }[];
  onSubmit: (input: QuickWalkinInput) => Promise<void>;
  isLoading?: boolean;
}

interface ClientSearchResult {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
}

export function QuickWalkinModal({
  isOpen,
  onClose,
  storeId,
  staffId,
  stylistName,
  services,
  onSubmit,
  isLoading = false,
}: QuickWalkinModalProps) {
  const [customerFullName, setCustomerFullName] = React.useState('');
  const [customerPhone, setCustomerPhone] = React.useState('');
  const [customerEmail, setCustomerEmail] = React.useState('');
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | null>(null);

  // Client search results
  const [searchResults, setSearchResults] = React.useState<ClientSearchResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  const [serviceId, setServiceId] = React.useState(services[0]?.id || '');
  React.useEffect(() => {
    if (services.length > 0 && !serviceId) {
      setServiceId(services[0].id);
    }
  }, [services, serviceId]);

  const [startTime, setStartTime] = React.useState(() => new Date().toISOString().slice(0, 16));
  const [customerNotes, setCustomerNotes] = React.useState('');

  // Search existing clients when typing name, phone, or email
  const handleSearchClients = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/staff/customers?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.customers || []);
      }
    } catch {
      // Ignore search error
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectClient = (client: ClientSearchResult) => {
    setSelectedCustomerId(client.id);
    setCustomerFullName(client.fullName);
    setCustomerEmail(client.email);
    setCustomerPhone(client.phone || '');
    setSearchResults([]);
  };

  const handleClearSelectedClient = () => {
    setSelectedCustomerId(null);
    setCustomerFullName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      storeId,
      staffId,
      serviceId,
      customerFullName,
      customerPhone,
      customerEmail: customerEmail || undefined,
      customerId: selectedCustomerId || undefined,
      startTime: new Date(startTime).toISOString(),
      customerNotes,
    });
    // Reset state
    handleClearSelectedClient();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title="Quick Walk-in Booking"
      description={`Book immediate walk-in service directly for ${stylistName}. Linked to client profile if registered.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Selected Client Badge */}
        {selectedCustomerId && (
          <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-emerald-600" />
              <span>
                Linked Account: <strong>{customerFullName}</strong> ({customerEmail})
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearSelectedClient}
              className="text-emerald-700 hover:text-emerald-900 font-bold p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="relative">
          <Input
            label="Client Full Name (Search or Type New)"
            value={customerFullName}
            onChange={(e) => {
              setCustomerFullName(e.target.value);
              setSelectedCustomerId(null);
              handleSearchClients(e.target.value);
            }}
            placeholder="e.g. Krushang Bhatia or Anand Patel"
            required
          />

          {searchResults.length > 0 && !selectedCustomerId && (
            <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Existing Registered Clients
              </div>
              {searchResults.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => handleSelectClient(client)}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-neutral-100 transition-colors"
                >
                  <span className="font-semibold text-neutral-900">{client.fullName}</span>
                  <span className="text-neutral-500">{client.email}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Client Email (Links to user account)"
            type="email"
            value={customerEmail}
            onChange={(e) => {
              setCustomerEmail(e.target.value);
              if (!selectedCustomerId) handleSearchClients(e.target.value);
            }}
            placeholder="client@gmail.com"
          />

          <Input
            label="Mobile Number"
            type="tel"
            value={customerPhone}
            onChange={(e) => {
              setCustomerPhone(e.target.value);
              if (!selectedCustomerId) handleSearchClients(e.target.value);
            }}
            placeholder="+91 98250 12345"
            required
          />
        </div>

        <Select
          label="Select Service"
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          options={services.map((s) => ({
            value: s.id,
            label: `${s.title} — ₹${s.price} (${s.durationMinutes} min)`,
          }))}
        />

        <Input
          label="Start Date & Time"
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />

        <Input
          label="Internal Notes / Consultation Requests (Optional)"
          value={customerNotes}
          onChange={(e) => setCustomerNotes(e.target.value)}
          placeholder="Client requested zero razor fade, sensitive scalp"
        />

        <div className="flex items-center justify-end gap-3 border-t border-neutral-100 pt-4 mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            leftIcon={<PlusCircle className="h-4 w-4" />}
          >
            Confirm Walk-in & Reserve
          </Button>
        </div>
      </form>
    </Modal>
  );
}
