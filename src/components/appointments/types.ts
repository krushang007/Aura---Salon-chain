import { AppointmentStatus } from '@/components/core';

export interface AppointmentPassData {
  id: string;
  passNumber: string; // e.g. '#AURA-SURAT-8921'
  status: AppointmentStatus;
  salonName: string;
  branchName: string;
  branchAddress: string;
  deskPhone: string;
  serviceTitle: string;
  servicePrice: number;
  durationMinutes: number;
  bufferMinutes: number;
  stylistName: string;
  stylistTitle: string;
  assignedChair: number;
  chairStationName: string;
  slotStartTime: string; // ISO
  slotEndTime: string;   // ISO
  arrivalWindow: string; // e.g. '2:35 PM - 2:45 PM'
  canCancel: boolean;
  hoursUntilSlot: number;
  cancellationCutoffTime: string; // formatted e.g. '12:45 PM'
  storeId?: string;
  staffId?: string;
  serviceId?: string;
}

export interface BookingHistoryItem {
  id: string;
  dateFormatted: string;
  salonAndBranch: string;
  stylistName: string;
  serviceTitle: string;
  price: number;
  status: AppointmentStatus;
  slotStartTime: string;
  canCancelOnline: boolean;
}
