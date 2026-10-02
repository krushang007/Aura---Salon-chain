'use client';

import * as React from 'react';
import { Modal, Button, Input } from '@/components/core';
import { Building2, Plus, Sparkles } from 'lucide-react';

export interface AddStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    branchName: string;
    locality: string;
    address: string;
    phone: string;
    totalStylingChairs: number;
    openingTime: string;
    closingTime: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function AddStoreModal({ isOpen, onClose, onSubmit, isLoading = false }: AddStoreModalProps) {
  const [branchName, setBranchName] = React.useState('');
  const [locality, setLocality] = React.useState('Piplod');
  const [address, setAddress] = React.useState('');
  const [phone, setPhone] = React.useState('+91 261 489 ');
  const [totalStylingChairs, setTotalStylingChairs] = React.useState(5);
  const [openingTime, setOpeningTime] = React.useState('09:00:00');
  const [closingTime, setClosingTime] = React.useState('21:00:00');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      branchName,
      locality,
      address,
      phone,
      totalStylingChairs,
      openingTime,
      closingTime,
    });
    // Reset fields
    setBranchName('');
    setAddress('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title="Add New Salon Outlet"
      description="Create a new verified branch outlet in Surat with dedicated physical chairs."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Input
          label="Branch Name"
          value={branchName}
          onChange={(e) => setBranchName(e.target.value)}
          placeholder="e.g. Salon Bonanza — Piplod Branch"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              Surat Locality
            </label>
            <select
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 focus-visible:border-neutral-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-900"
            >
              <option value="Althan">Althan</option>
              <option value="Adajan">Adajan</option>
              <option value="Vesu">Vesu</option>
              <option value="Piplod">Piplod</option>
              <option value="City Light">City Light</option>
              <option value="Pal">Pal</option>
              <option value="Katargam">Katargam</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              Physical Styling Chairs
            </label>
            <input
              type="number"
              min={1}
              max={25}
              value={totalStylingChairs}
              onChange={(e) => setTotalStylingChairs(Number(e.target.value))}
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 focus-visible:border-neutral-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-900"
              required
            />
          </div>
        </div>

        <Input
          label="Street Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Shop 201, Nexus Hub, Dumas Rd, Piplod"
          required
        />

        <Input
          label="Contact Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 261 489 0129"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              Opening Time
            </label>
            <input
              type="time"
              value={openingTime.slice(0, 5)}
              onChange={(e) => setOpeningTime(`${e.target.value}:00`)}
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 focus-visible:border-neutral-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-900"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              Closing Time
            </label>
            <input
              type="time"
              value={closingTime.slice(0, 5)}
              onChange={(e) => setClosingTime(`${e.target.value}:00`)}
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 focus-visible:border-neutral-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-900"
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-neutral-100 pt-4 mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create Branch Outlet
          </Button>
        </div>
      </form>
    </Modal>
  );
}
