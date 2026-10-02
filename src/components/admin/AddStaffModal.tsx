'use client';

import * as React from 'react';
import { Modal, Button, Input, Select } from '@/components/core';
import { Info, UserPlus } from 'lucide-react';
import { ProvisionStaffInput } from './types';

export interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  salonName: string;
  stores: { id: string; name: string }[];
  onSubmit: (input: ProvisionStaffInput) => Promise<void>;
  isLoading?: boolean;
}

export function AddStaffModal({
  isOpen,
  onClose,
  salonName,
  stores,
  onSubmit,
  isLoading = false,
}: AddStaffModalProps) {
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('Password@123');
  const [storeId, setStoreId] = React.useState(stores[0]?.id || '');
  const [primaryRoleTitle, setPrimaryRoleTitle] = React.useState('Senior Stylist');
  const [assignedChair, setAssignedChair] = React.useState(2);
  const [shiftStart, setShiftStart] = React.useState('09:00:00');
  const [shiftEnd, setShiftEnd] = React.useState('18:00:00');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      fullName,
      email,
      temporaryPassword: password,
      storeId,
      primaryRoleTitle,
      assignedChair,
      chairStationName: `Chair ${String(assignedChair).padStart(2, '0')}`,
      shiftDays: [1, 2, 3, 4, 5], // Monday through Friday
      shiftStart,
      shiftEnd,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={`Add New Staff Member to ${salonName}`}
      description="Provision account credentials, branch location, and primary styling chair."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Input
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Rahul Sharma"
          required
        />

        <Input
          label="Staff Login Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="abc@gmail.com"
          required
        />

        {/* Informational Callout: Zero Invite Friction */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 flex items-start gap-2.5 text-xs text-neutral-600">
          <Info className="h-4 w-4 shrink-0 text-neutral-500 mt-0.5" />
          <p className="leading-relaxed">
            No email or SMS invite is sent. When <span className="font-semibold text-neutral-800">{email || 'abc@gmail.com'}</span> signs in to Aura with their password, their stylist portal, shifts, and chair schedule are automatically activated.
          </p>
        </div>

        <Select
          label="Assigned Branch"
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          options={stores.map((s) => ({ value: s.id, label: s.name }))}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Primary Role / Title"
            value={primaryRoleTitle}
            onChange={(e) => setPrimaryRoleTitle(e.target.value)}
            options={[
              { value: 'Master Stylist', label: 'Master Stylist' },
              { value: 'Senior Stylist', label: 'Senior Stylist' },
              { value: 'Senior Colorist', label: 'Senior Colorist' },
              { value: 'Grooming Specialist', label: 'Grooming Specialist' },
            ]}
          />

          <Select
            label="Station Chair"
            value={String(assignedChair)}
            onChange={(e) => setAssignedChair(Number(e.target.value))}
            options={[
              { value: '1', label: 'Chair 01' },
              { value: '2', label: 'Chair 02' },
              { value: '3', label: 'Chair 03' },
              { value: '4', label: 'Chair 04' },
              { value: '5', label: 'Chair 05' },
            ]}
          />
        </div>

        <Select
          label="Weekly Shift Template"
          value="mon-fri"
          options={[
            { value: 'mon-fri', label: 'Mon-Fri: 09:00 - 18:00 (Standard 45-hr)' },
            { value: 'tue-sat', label: 'Tue-Sat: 10:00 - 19:00 (Weekend Focus)' },
          ]}
        />

        <div className="flex items-center justify-end gap-3 border-t border-neutral-100 pt-4 mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            leftIcon={<UserPlus className="h-4 w-4" />}
          >
            Add Staff Member
          </Button>
        </div>
      </form>
    </Modal>
  );
}
