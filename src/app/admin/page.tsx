'use client';

import * as React from 'react';
import {
  StaffManagementTable,
  AddStaffModal,
  CloneServiceModal,
  AddStoreModal,
  EditStaffModal,
  EditStoreModal,
} from '@/components/admin';
import { StaffMember, ProvisionStaffInput, CloneServiceInput } from '@/components/admin/types';
import { Button, useToast } from '@/components/core';
import {
  Copy,
  PlusCircle,
  Loader2,
  Store,
  Armchair,
  Users,
  CalendarCheck,
  TrendingUp,
  MapPin,
  Clock,
  Phone,
} from 'lucide-react';

export default function AdminPortalPage() {
  const toast = useToast();
  const [staffList, setStaffList] = React.useState<StaffMember[]>([]);
  const [stores, setStores] = React.useState<{ id: string; name: string; totalStylingChairs?: number; address?: string; phone?: string; locality?: string; openingTime?: string; closingTime?: string }[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Modals state
  const [isAddStaffOpen, setIsAddStaffOpen] = React.useState(false);
  const [isEditStaffOpen, setIsEditStaffOpen] = React.useState(false);
  const [selectedStaffToEdit, setSelectedStaffToEdit] = React.useState<StaffMember | null>(null);
  const [isAddStoreOpen, setIsAddStoreOpen] = React.useState(false);
  const [isEditStoreOpen, setIsEditStoreOpen] = React.useState(false);
  const [selectedStoreToEdit, setSelectedStoreToEdit] = React.useState<any>(null);
  const [isCloneModalOpen, setIsCloneModalOpen] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      const [staffRes, outletsRes] = await Promise.all([
        fetch('/api/admin/staff'),
        fetch('/api/admin/outlets'),
      ]);

      if (staffRes.status === 401 || staffRes.status === 403) {
        window.location.href = '/login';
        return;
      }

      const staffData = await staffRes.json();
      setStaffList(staffData.staff || []);

      if (outletsRes.ok) {
        const outletsData = await outletsRes.json();
        setStores(outletsData.stores || staffData.stores || []);
      } else {
        setStores(staffData.stores || []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      toast.error('Failed to load salon operational data', 'Network Error');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

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
        toast.success(data.message || 'Staff member provisioned successfully.', 'Staff Added');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to provision staff', 'Provision Error');
      }
    } catch {
      toast.error('Network error provisioning staff member.', 'Network Error');
    }
  };

  const handleEditStaffSave = async (data: {
    staffId: string;
    fullName: string;
    title: string;
    assignedChair: number;
    storeId: string;
    newPassword?: string;
    isActive: boolean;
  }) => {
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message || 'Staff profile updated successfully.', 'Changes Saved');
        fetchData();
      } else {
        toast.error(result.error || 'Failed to update staff member', 'Update Error');
      }
    } catch {
      toast.error('Network error updating staff member.', 'Network Error');
    }
  };

  const handleCreateStore = async (data: {
    branchName: string;
    locality: string;
    address: string;
    phone: string;
    totalStylingChairs: number;
    openingTime: string;
    closingTime: string;
  }) => {
    try {
      const res = await fetch('/api/admin/outlets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message || 'New salon branch created successfully.', 'Outlet Created');
        fetchData();
      } else {
        toast.error(result.error || 'Failed to create salon outlet', 'Creation Error');
      }
    } catch {
      toast.error('Network error creating salon outlet.', 'Network Error');
    }
  };

  const handleSaveStore = async (data: any) => {
    try {
      const res = await fetch('/api/admin/outlets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message || 'Store settings updated.', 'Saved');
        fetchData();
      } else {
        toast.error(result.error || 'Failed to update store', 'Update Error');
      }
    } catch {
      toast.error('Network error updating store settings.', 'Network Error');
    }
  };

  const handleCloneServices = async (input: CloneServiceInput) => {
    if (!input.sourceStoreId || !input.targetStoreId) {
      toast.error('Please select both a source salon and a target salon.', 'Validation');
      return;
    }
    try {
      const res = await fetch('/api/admin/clone-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Catalog cloned successfully across branches.', 'Sync Complete');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to clone service catalog', 'Clone Error');
      }
    } catch {
      toast.error('Network error cloning services across branches.', 'Network Error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  // Analytics Metrics Calculations
  const totalChairs = stores.reduce((acc, s) => acc + (s.totalStylingChairs || 5), 0);
  const activeStaff = staffList.filter((s) => s.isActive).length;
  const utilizationRate = totalChairs > 0 ? Math.min(100, Math.round((activeStaff / totalChairs) * 100)) : 85;

  return (
    <div className="min-h-screen bg-neutral-50/40 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6 bg-white p-6 rounded-2xl border shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-md bg-neutral-900 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Admin Command Center
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              Admin Management — Salon Operations & Branch Roster
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Multi-branch operations: Live capacity monitoring, station assignments, and multi-outlet management in Surat.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Store className="h-4 w-4" />}
              onClick={() => setIsAddStoreOpen(true)}
            >
              Add Salon Outlet
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Copy className="h-4 w-4" />}
              onClick={() => setIsCloneModalOpen(true)}
              disabled={stores.length < 2}
            >
              Clone Catalog Across Outlets
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlusCircle className="h-4 w-4" />}
              onClick={() => setIsAddStaffOpen(true)}
              disabled={stores.length === 0}
            >
              Add Staff Member
            </Button>
          </div>
        </div>

        {/* Operational Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase tracking-wider">
              <span>Verified Outlets</span>
              <Store className="h-4 w-4 text-neutral-400" />
            </div>
            <p className="font-display text-2xl font-bold text-neutral-900">{stores.length}</p>
            <p className="text-[11px] text-neutral-400">Active branches in Surat</p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase tracking-wider">
              <span>Station Capacity</span>
              <Armchair className="h-4 w-4 text-neutral-400" />
            </div>
            <p className="font-display text-2xl font-bold text-neutral-900">{totalChairs} Chairs</p>
            <p className="text-[11px] text-emerald-600 font-medium">100% Guaranteed Physical Stations</p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase tracking-wider">
              <span>Stylists on Duty</span>
              <Users className="h-4 w-4 text-neutral-400" />
            </div>
            <p className="font-display text-2xl font-bold text-neutral-900">{activeStaff} Active</p>
            <p className="text-[11px] text-neutral-400">Total roster: {staffList.length} staff</p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold uppercase tracking-wider">
              <span>Floor Utilization</span>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="font-display text-2xl font-bold text-neutral-900">{utilizationRate}%</p>
            <p className="text-[11px] text-neutral-400">Station assignment efficiency</p>
          </div>
        </div>

        {/* Section 1: Salon Outlets & Physical Chairs Directory */}
        <section id="outlets" className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <div>
              <h2 className="font-display text-lg font-bold text-neutral-900">
                Salon Outlets & Station Configuration
              </h2>
              <p className="text-xs text-neutral-500">
                Manage branch operating schedules, physical chair capacities, and customer contact lines.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Store className="h-4 w-4" />}
              onClick={() => setIsAddStoreOpen(true)}
            >
              Add Branch
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stores.map((st) => (
              <div
                key={st.id}
                className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3 shadow-xs hover:border-neutral-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-700 uppercase">
                      {st.locality || 'Surat'}
                    </span>
                    <h3 className="font-display text-base font-bold text-neutral-900 mt-1">{st.name}</h3>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-neutral-500">
                  <p className="flex items-center gap-1.5 truncate">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                    <span className="truncate">{st.address || 'Surat, Gujarat'}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                    <span>{st.phone || '+91 261 489 0000'}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                    <span>{st.openingTime?.slice(0, 5) || '09:00'} - {st.closingTime?.slice(0, 5) || '21:00'}</span>
                  </p>
                </div>

                <div className="border-t border-neutral-100 pt-3 flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-700 flex items-center gap-1.5">
                    <Armchair className="h-3.5 w-3.5 text-neutral-400" />
                    {st.totalStylingChairs || 5} Physical Chairs
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
                      {(st as any).servicesCount !== undefined ? (st as any).servicesCount : 0} Services
                    </span>
                    <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
                      {(st as any).staffCount !== undefined ? (st as any).staffCount : 0} Stylists
                    </span>
                  </div>
                </div>

                <div className="pt-1 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-semibold"
                    onClick={() => {
                      setSelectedStoreToEdit(st);
                      setIsEditStoreOpen(true);
                    }}
                  >
                    Edit Settings & Hours
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Staff Management Directory */}
        <section id="staff" className="space-y-4">
          <StaffManagementTable
            staffList={staffList}
            onOpenAddModal={() => setIsAddStaffOpen(true)}
            onEditStaff={(st) => {
              setSelectedStaffToEdit(st);
              setIsEditStaffOpen(true);
            }}
          />
        </section>

        {/* Modals */}
        <AddStoreModal
          isOpen={isAddStoreOpen}
          onClose={() => setIsAddStoreOpen(false)}
          onSubmit={handleCreateStore}
        />

        <AddStaffModal
          isOpen={isAddStaffOpen}
          onClose={() => setIsAddStaffOpen(false)}
          salonName="Salon Bonanza"
          stores={stores}
          onSubmit={handleProvisionStaff}
        />

        <EditStaffModal
          isOpen={isEditStaffOpen}
          onClose={() => {
            setIsEditStaffOpen(false);
            setSelectedStaffToEdit(null);
          }}
          staff={selectedStaffToEdit}
          stores={stores}
          onSave={handleEditStaffSave}
        />

        <CloneServiceModal
          isOpen={isCloneModalOpen}
          onClose={() => setIsCloneModalOpen(false)}
          stores={stores}
          onClone={handleCloneServices}
        />

        <EditStoreModal
          isOpen={isEditStoreOpen}
          onClose={() => {
            setIsEditStoreOpen(false);
            setSelectedStoreToEdit(null);
          }}
          store={selectedStoreToEdit}
          onSave={handleSaveStore}
        />
      </div>
    </div>
  );
}
