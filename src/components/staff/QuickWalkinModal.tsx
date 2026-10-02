'use client';

import * as React from 'react';
import { Modal, Button, Input, Select } from '@/components/core';
import { PlusCircle } from 'lucide-react';
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
  const [serviceId, setServiceId] = React.useState(services[0]?.id || '');
  const [startTime, setStartTime] = React.useState(() => new Date().toISOString().slice(0, 16));
  const [customerNotes, setCustomerNotes] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      storeId,
      staffId,
      serviceId,
      customerFullName,
      customerPhone,
      startTime: new Date(startTime).toISOString(),
      customerNotes,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title="Quick Walk-in & Phone Booking"
      description={`Book immediate walk-in service directly for ${stylistName}.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Input
          label="Customer Full Name"
          value={customerFullName}
          onChange={(e) => setCustomerFullName(e.target.value)}
          placeholder="e.g. Anand Patel"
          required
        />

        <Input
          label="Customer Mobile Number"
          type="tel"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          placeholder="+91 98250 12345"
          required
        />

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
            Lock Walk-in Seat
          </Button>
        </div>
      </form>
    </Modal>
  );
}
