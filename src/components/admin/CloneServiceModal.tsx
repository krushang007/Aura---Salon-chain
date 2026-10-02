'use client';

import * as React from 'react';
import { Modal, Button, Select } from '@/components/core';
import { Copy, ArrowRight, Sparkles } from 'lucide-react';
import { CloneServiceInput } from './types';

export interface CloneServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: { id: string; name: string; servicesCount?: number }[];
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
  const [sourceStoreId, setSourceStoreId] = React.useState('master-catalog');
  const [targetStoreId, setTargetStoreId] = React.useState('');

  React.useEffect(() => {
    if (stores.length > 0 && !targetStoreId) {
      // Pick target store that has least services or first store
      const emptyStore = stores.find((s) => (s.servicesCount || 0) === 0);
      setTargetStoreId(emptyStore ? emptyStore.id : stores[0].id);
    }
  }, [stores, targetStoreId]);

  const handleClone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStoreId) return;
    if (sourceStoreId !== 'master-catalog' && sourceStoreId === targetStoreId) return;
    await onClone({ sourceStoreId, targetStoreId });
    onClose();
  };

  const sourceOptions = [
    { value: 'master-catalog', label: '⭐ Aura Master Luxury Catalog (4 standard services)' },
    ...stores.map((s) => ({
      value: s.id,
      label: `${s.name} (${s.servicesCount !== undefined ? s.servicesCount : 0} services)`,
      disabled: (s.servicesCount || 0) === 0,
    })),
  ];

  const targetOptions = stores.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.servicesCount !== undefined ? s.servicesCount : 0} existing services)`,
    disabled: s.id === sourceStoreId,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title="Clone Service Catalog Across Branches"
      description="Replicate your active haircut, spa, and treatment catalog from a template branch or master catalog to any branch outlet in Surat."
    >
      <form onSubmit={handleClone} className="space-y-4 pt-2">
        <Select
          label="Source Catalog (Template)"
          value={sourceStoreId}
          onChange={(e) => setSourceStoreId(e.target.value)}
          options={sourceOptions}
        />

        <div className="flex justify-center text-neutral-400 py-1">
          <ArrowRight className="h-5 w-5 rotate-90 sm:rotate-0" />
        </div>

        <Select
          label="Target Branch (Destination Outlet)"
          value={targetStoreId}
          onChange={(e) => setTargetStoreId(e.target.value)}
          options={targetOptions}
        />

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600 leading-relaxed">
          All services, duration minutes, buffer policies, and price tiers from the source will be duplicated into the target branch. Existing services in the target branch will remain intact.
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-neutral-100 pt-4 mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={!targetStoreId || (sourceStoreId !== 'master-catalog' && sourceStoreId === targetStoreId)}
            leftIcon={<Copy className="h-4 w-4" />}
          >
            Clone Catalog
          </Button>
        </div>
      </form>
    </Modal>
  );
}
