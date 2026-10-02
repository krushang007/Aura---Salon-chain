'use client';

import * as React from 'react';
import { StaffManagementTable, AddStaffModal, CloneServiceModal } from '@/components/admin';
import { StaffMember, ProvisionStaffInput, CloneServiceInput } from '@/components/admin/types';
import { Button } from '@/components/core';
import { Copy, PlusCircle, Loader2 } from 'lucide-react';

export default function AdminPortalPage() {
  const [staffList, setStaffList] = React.useState<StaffMember[]>([]);
  const [stores, setStores] = React.useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAddStaffOpen, setIsAddStaffOpen] = React.useState(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/staff');
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/login';
        return;
      }
      const data = await res.json();
      setStaffList(data.staff || []);
      setStores(data.stores || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProvisionStaff = async (input: ProvisionStaffInput) => {
    try {
      const res = await fetch('/api/admin/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback(data.message || 'Staff member provisioned successfully.');
        fetchData();
      } else {
        alert(data.error || 'Failed to provision staff');
      }
    } catch {
      alert('Error provisioning staff member.');
    }
  };

  const handleCloneServices = async (input: CloneServiceInput) => {
    try {
      const res = await fetch('/api/admin/clone-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback(data.message || 'Catalog cloned successfully.');
      } else {
        alert(data.error || 'Failed to clone services');
      }
    } catch {
      alert('Error cloning services across branches.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-neutral-900">
              Salon Bonanza — Admin Management
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Multi-branch operations, staff chair provisioning, and cross-branch service catalog cloning in Surat.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Copy className="h-4 w-4" />}
              onClick={() => setIsCloneModalOpen(true)}
            >
              Clone Catalog Across Outlets
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlusCircle className="h-4 w-4" />}
              onClick={() => setIsAddStaffOpen(true)}
            >
              Add Staff Member
            </Button>
          </div>
        </div>

        {feedback && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
            {feedback}
          </div>
        )}

        <StaffManagementTable
          staffList={staffList}
          onOpenAddModal={() => setIsAddStaffOpen(true)}
          onEditStaff={() => alert('Shift editing mode')}
        />

        <AddStaffModal
          isOpen={isAddStaffOpen}
          onClose={() => setIsAddStaffOpen(false)}
          salonName="Salon Bonanza"
          stores={stores}
          onSubmit={handleProvisionStaff}
        />

        <CloneServiceModal
          isOpen={isCloneModalOpen}
          onClose={() => setIsCloneModalOpen(false)}
          stores={stores}
          onClone={handleCloneServices}
        />
      </div>
    </div>
  );
}
