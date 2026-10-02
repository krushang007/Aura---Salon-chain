'use client';

import * as React from 'react';
import { Modal, Button, Select } from '@/components/core';
import { Copy, ArrowRight } from 'lucide-react';
import { CloneServiceInput } from './types';

export interface CloneServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: { id: string; name: string }[];
  onClone: (input: CloneServiceInput) => Promise<void>;
  isLoading?: boolean;
}

export function CloneServiceModal({
  isOpen,
  onClose,
  stores,
  onClone,
  isLoading = false,
}: CloneServiceModalProps) {
  const [sourceStoreId, setSourceStoreId] = React.useState(stores[0]?.id || '');
  const [targetStoreId, setTargetStoreId] = React.useState(stores[1]?.id || '');

  const handleClone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceStoreId === targetStoreId) return;
    await onClone({ sourceStoreId, targetStoreId });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title="Clone Services Across Branches"
      description="Replicate your active haircut, spa, and treatment catalog from a template branch to a new outlet in Surat."
    >
      <form onSubmit={handleClone} className="space-y-4 pt-2">
        <Select
          label="Source Branch (Template)"
          value={sourceStoreId}
          onChange={(e) => setSourceStoreId(e.target.value)}
          options={stores.map((s) => ({ value: s.id, label: s.name }))}
        />

        <div className="flex justify-center text-neutral-400 py-1">
          <ArrowRight className="h-5 w-5 rotate-90 sm:rotate-0" />
        </div>

        <Select
          label="Target Branch (New Outlet)"
          value={targetStoreId}
          onChange={(e) => setTargetStoreId(e.target.value)}
          options={stores.map((s) => ({
            value: s.id,
            label: s.name,
            disabled: s.id === sourceStoreId,
          }))}
        />

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600 leading-relaxed">
          All active services, duration minutes, buffer policies, and price tiers will be duplicated. Existing services in the target branch remain unaffected.
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-neutral-100 pt-4 mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={sourceStoreId === targetStoreId}
            leftIcon={<Copy className="h-4 w-4" />}
          >
            Clone Catalog
          </Button>
        </div>
      </form>
    </Modal>
  );
}
