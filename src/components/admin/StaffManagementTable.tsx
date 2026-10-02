'use client';

import * as React from 'react';
import { Button, Badge } from '@/components/core';
import { UserPlus, Star, Armchair, MoreVertical, Edit2 } from 'lucide-react';
import { StaffMember } from './types';

export interface StaffManagementTableProps {
  staffList: StaffMember[];
  onOpenAddModal: () => void;
  onEditStaff: (staff: StaffMember) => void;
}

export function StaffManagementTable({
  staffList,
  onOpenAddModal,
  onEditStaff,
}: StaffManagementTableProps) {
  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h2 className="font-display text-xl font-bold text-neutral-900">Stylist & Staff Directory</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage salon staff, station chair assignments, and branch rosters across Surat outlets.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={onOpenAddModal}
          leftIcon={<UserPlus className="h-4 w-4" />}
        >
          Add Staff Member
        </Button>
      </div>

      {/* Directory Table */}
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3">Stylist Profile</th>
                <th className="px-5 py-3">Branch Location</th>
                <th className="px-5 py-3">Assigned Chair</th>
                <th className="px-5 py-3">Client Rating</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-800">
              {staffList.map((st) => (
                <tr key={st.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
                        {st.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-neutral-900 text-sm">{st.fullName}</p>
                        <p className="text-neutral-500 text-[11px]">{st.email} • {st.title}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap font-medium text-neutral-700">
                    {st.branchName}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 font-mono text-[11px] text-neutral-800">
                      <Armchair className="h-3 w-3" />
                      {st.chairStationName}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1 font-semibold text-neutral-900">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                      <span>{st.ratingAverage.toFixed(1)}</span>
                      <span className="text-neutral-400 font-normal">({st.totalReviews})</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <Badge variant={st.isActive ? 'success' : 'neutral'} dot>
                      {st.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <Button variant="outline" size="sm" onClick={() => onEditStaff(st)}>
                      Edit Shifts
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
