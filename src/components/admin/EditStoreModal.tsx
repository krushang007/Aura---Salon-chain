'use client';

import * as React from 'react';
import { Modal, Button, Input } from '@/components/core';
import { Save, Building2 } from 'lucide-react';

export interface EditStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: {
    id: string;
    name: string;
    locality?: string;
    address?: string;
    phone?: string;
    totalStylingChairs?: number;
    openingTime?: string;
    closingTime?: string;
    isActive?: boolean;
    isPublished?: boolean;
  } | null;
  onSave: (data: {
    storeId: string;
    branchName: string;
    locality: string;
    address: string;
    phone: string;
    totalStylingChairs: number;
    openingTime: string;
    closingTime: string;
    isActive: boolean;
    isPublished: boolean;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function EditStoreModal({ isOpen, onClose, store, onSave, isLoading = false }: EditStoreModalProps) {
  const [branchName, setBranchName] = React.useState('');
  const [locality, setLocality] = React.useState('Althan');
  const [address, setAddress] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [totalStylingChairs, setTotalStylingChairs] = React.useState(5);
  const [openingTime, setOpeningTime] = React.useState('09:00:00');
  const [closingTime, setClosingTime] = React.useState('21:00:00');
  const [isActive, setIsActive] = React.useState(true);
  const [isPublished, setIsPublished] = React.useState(true);

  React.useEffect(() => {
    if (store) {
      setBranchName(store.name || '');
      setLocality(store.locality || 'Althan');
      setAddress(store.address || '');
      setPhone(store.phone || '');
      setTotalStylingChairs(store.totalStylingChairs || 5);
      setOpeningTime(store.openingTime || '09:00:00');
      setClosingTime(store.closingTime || '21:00:00');
      setIsActive(store.isActive !== undefined ? store.isActive : true);
      setIsPublished(store.isPublished !== undefined ? store.isPublished : true);
    }
  }, [store]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    await onSave({
      storeId: store.id,
      branchName,
      locality,
      address,
      phone,
      totalStylingChairs,
      openingTime,
      closingTime,
      isActive,
      isPublished,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title="Edit Branch Settings"
      description="Update operational timings, physical chair stations, and contact info for this salon outlet."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Input
          label="Branch Name"
          value={branchName}
          onChange={(e) => setBranchName(e.target.value)}
          placeholder="e.g. Salon Bonanza — Vesu Branch"
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
              max={50}
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
          placeholder="Street, building, floor"
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

        <div className="flex items-center gap-6 pt-2 border-t border-neutral-100">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
            />
            <span className="text-xs font-medium text-neutral-700">Branch Operational (Active)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
            />
            <span className="text-xs font-medium text-neutral-700">Published in Marketplace</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-neutral-100 pt-4 mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save Branch Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
