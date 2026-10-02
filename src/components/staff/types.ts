import { AppointmentStatus } from '@/components/core';

export interface RosterSlotBooking {
  id: string;
  timeDisplay: string;
  durationMinutes: number;
  customerName: string;
  customerPhone?: string;
  serviceTitle: string;
  assignedChair: number;
  chairStationName: string;
  status: AppointmentStatus;
}

export interface QuickWalkinInput {
  storeId: string;
  staffId: string;
  serviceId: string;
  customerFullName: string;
  customerPhone: string;
  customerEmail?: string;
  customerId?: string;
  startTime: string; // ISO
  customerNotes?: string;
}
