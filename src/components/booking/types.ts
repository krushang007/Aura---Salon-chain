export interface StylistSummary {
  id: string;
  fullName: string;
  title: string;
  assignedChair: number;
  chairStationName: string;
  ratingAverage: number;
  totalReviews: number;
  isAvailableToday: boolean;
}

export interface ServiceDetail {
  id: string;
  title: string;
  category: string;
  description: string;
  durationMinutes: number;
  bufferMinutes: number;
  price: number;
}

export interface BookingState {
  selectedServiceId: string | null;
  selectedStaffId: string | null;
  selectedDate: string; // 'YYYY-MM-DD'
  selectedSlotTime: string | null; // '14:30'
  customerNotes: string;
}
