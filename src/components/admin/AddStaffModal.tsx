'use client';

import * as React from 'react';
import { Modal, Button, Input, Select } from '@/components/core';
import { Info, UserPlus, Key, Copy, CheckCircle2 } from 'lucide-react';
import { ProvisionStaffInput } from './types';

export interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  salonName: string;
  stores: { id: string; name: string; totalStylingChairs?: number }[];
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
  const [isCustomRole, setIsCustomRole] = React.useState(false);
  const [customRole, setCustomRole] = React.useState('');
  const [assignedChair, setAssignedChair] = React.useState(2);
  const [shiftStart, setShiftStart] = React.useState('09:00:00');
  const [shiftEnd, setShiftEnd] = React.useState('18:00:00');

  // Success view with copied state
  const [createdCredentials, setCreatedCredentials] = React.useState<{ email: string; pass: string } | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (stores.length > 0 && !storeId) {
      setStoreId(stores[0].id);
    }
  }, [stores, storeId]);

  const selectedStore = stores.find((s) => s.id === storeId) || stores[0];
  const chairCount = selectedStore?.totalStylingChairs || 6;
  const chairOptions = Array.from({ length: chairCount }, (_, i) => ({
    value: String(i + 1),
    label: `Chair ${String(i + 1).padStart(2, '0')}`,
  }));

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let res = '';
    for (let i = 0; i < 10; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
    setPassword(res);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalRole = isCustomRole && customRole.trim() ? customRole.trim() : primaryRoleTitle;

    await onSubmit({
      fullName,
      email,
      temporaryPassword: password,
      storeId,
      primaryRoleTitle: finalRole,
      assignedChair,
      chairStationName: `Chair ${String(assignedChair).padStart(2, '0')}`,
      shiftDays: [1, 2, 3, 4, 5],
      shiftStart,
      shiftEnd,
    });

    setCreatedCredentials({ email, pass: password });
  };

  const handleCopy = () => {
    if (!createdCredentials) return;
    navigator.clipboard.writeText(
      `Aura Staff Login:
Email: ${createdCredentials.email}
Password: ${createdCredentials.pass}
Login URL: http://localhost:3000/login`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDone = () => {
    setCreatedCredentials(null);
    setFullName('');
    setEmail('');
    setPassword('Password@123');
    setCustomRole('');
    setIsCustomRole(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={createdCredentials ? handleDone : onClose}
      maxWidth="md"
      title={createdCredentials ? 'Staff Member Credentials' : `Add New Staff Member to ${salonName}`}
      description={
        createdCredentials
          ? 'Share these login credentials directly with the stylist.'
          : 'Provision account credentials, branch location, and primary styling chair.'
      }
    >
      {createdCredentials ? (
        <div className="space-y-5 pt-2">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Staff Account Active
            </div>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Account created with zero email invite friction. When signed in, their stylist portal, assigned chair, and shifts are instantly ready.
            </p>
            <div className="rounded-xl border border-emerald-200 bg-white p-3.5 space-y-1.5 font-mono text-xs">
              <p><span className="text-neutral-400">Email:</span> <strong className="text-neutral-900">{createdCredentials.email}</strong></p>
              <p><span className="text-neutral-400">Password:</span> <strong className="text-neutral-900">{createdCredentials.pass}</strong></p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              leftIcon={<Copy className="h-4 w-4" />}
            >
              {copied ? 'Copied to Clipboard!' : 'Copy Login Info'}
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={handleDone}>
              Done
            </Button>
          </div>
        </div>
      ) : (
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
            placeholder="e.g. abc@gmail.com or rahul@salonbonanza.com"
            required
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600">
                Temporary Login Password
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-xs font-medium text-neutral-600 hover:text-neutral-900 underline"
              >
                Auto-generate
              </button>
            </div>
            <Input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Select
            label="Assigned Branch"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            options={stores.map((s) => ({ value: s.id, label: s.name }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600">
                Primary Role / Title
              </label>
              <select
                value={isCustomRole ? 'Custom' : primaryRoleTitle}
                onChange={(e) => {
                  if (e.target.value === 'Custom') {
                    setIsCustomRole(true);
                  } else {
                    setIsCustomRole(false);
                    setPrimaryRoleTitle(e.target.value);
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
            </div>

            <Select
              label="Station Chair"
              value={String(assignedChair)}
              onChange={(e) => setAssignedChair(Number(e.target.value))}
              options={chairOptions}
            />
          </div>

          {isCustomRole && (
            <Input
              label="Custom Role Name"
              placeholder="e.g. Bridal Specialist"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              required
            />
          )}

          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 flex items-start gap-2.5 text-xs text-neutral-600">
            <Info className="h-4 w-4 shrink-0 text-neutral-500 mt-0.5" />
            <p className="leading-relaxed">
              No email invite is required. Share the login email and password directly with your stylist.
            </p>
          </div>

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
      )}
    </Modal>
  );
}
