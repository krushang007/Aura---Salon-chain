'use client';

import * as React from 'react';
import { Modal, Button, Input, Select } from '@/components/core';
import { Edit3, Key, Check } from 'lucide-react';
import { StaffMember } from './types';

export interface EditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember | null;
  stores: { id: string; name: string; totalStylingChairs?: number }[];
  onSave: (data: {
    staffId: string;
    fullName: string;
    title: string;
    assignedChair: number;
    storeId: string;
    newPassword?: string;
    isActive: boolean;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function EditStaffModal({
  isOpen,
  onClose,
  staff,
  stores,
  onSave,
  isLoading = false,
}: EditStaffModalProps) {
  const [fullName, setFullName] = React.useState('');
  const [title, setTitle] = React.useState('Senior Stylist');
  const [isCustomTitle, setIsCustomTitle] = React.useState(false);
  const [customTitle, setCustomTitle] = React.useState('');
  const [storeId, setStoreId] = React.useState('');
  const [assignedChair, setAssignedChair] = React.useState(1);
  const [newPassword, setNewPassword] = React.useState('');
  const [isActive, setIsActive] = React.useState(true);

  React.useEffect(() => {
    if (staff) {
      setFullName(staff.fullName || '');
      const standardRoles = ['Master Stylist', 'Senior Stylist', 'Senior Colorist', 'Grooming Specialist'];
      if (standardRoles.includes(staff.title)) {
        setTitle(staff.title);
        setIsCustomTitle(false);
        setCustomTitle('');
      } else {
        setTitle('Custom');
        setIsCustomTitle(true);
        setCustomTitle(staff.title || '');
      }
      setStoreId(staff.storeId || stores[0]?.id || '');
      setAssignedChair(staff.assignedChair || 1);
      setIsActive(staff.isActive !== false);
      setNewPassword('');
    }
  }, [staff, stores]);

  if (!staff) return null;

  const currentStore = stores.find((s) => s.id === storeId) || stores[0];
  const maxChairs = currentStore?.totalStylingChairs || 6;
  const chairOptions = Array.from({ length: maxChairs }, (_, i) => ({
    value: String(i + 1),
    label: `Chair ${String(i + 1).padStart(2, '0')}`,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = isCustomTitle && customTitle.trim() ? customTitle.trim() : title;
    await onSave({
      staffId: staff.id,
      fullName,
      title: finalTitle,
      assignedChair: Number(assignedChair),
      storeId,
      newPassword: newPassword.trim() ? newPassword.trim() : undefined,
      isActive,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={`Edit Staff Profile — ${staff.fullName}`}
      description="Update stylist role, physical station chair assignment, or reset password."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Input
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600">
            Professional Title / Role
          </label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={isCustomTitle ? 'Custom' : title}
              onChange={(e) => {
                if (e.target.value === 'Custom') {
                  setIsCustomTitle(true);
                } else {
                  setIsCustomTitle(false);
                  setTitle(e.target.value);
                }
              }}
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 focus-visible:border-neutral-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-900"
            >
              <option value="Master Stylist">Master Stylist</option>
              <option value="Senior Stylist">Senior Stylist</option>
              <option value="Senior Colorist">Senior Colorist</option>
              <option value="Grooming Specialist">Grooming Specialist</option>
              <option value="Custom">Custom Role...</option>
            </select>

            {isCustomTitle ? (
              <input
                type="text"
                placeholder="e.g. Bridal Specialist"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 focus-visible:border-neutral-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-900"
                required
              />
            ) : (
              <div className="flex items-center text-xs text-neutral-400 px-3 border border-dashed rounded-lg">
                Standard Preset
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Assigned Branch"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            options={stores.map((s) => ({ value: s.id, label: s.name }))}
          />

          <Select
            label="Station Chair"
            value={String(assignedChair)}
            onChange={(e) => setAssignedChair(Number(e.target.value))}
            options={chairOptions}
          />
        </div>

        <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700">
            <Key className="h-3.5 w-3.5 text-neutral-500" />
            Reset Stylist Password (Optional)
          </div>
          <input
            type="password"
            placeholder="Leave blank to preserve current password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus-visible:border-neutral-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-900"
          />
          <p className="text-[11px] text-neutral-400">
            If provided, immediately updates login password without requiring email verification.
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-neutral-100 pt-4 mt-6">
          <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
            />
            Active for Client Bookings
          </label>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
              leftIcon={<Check className="h-4 w-4" />}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
