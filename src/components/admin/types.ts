export interface StaffMember {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  storeId: string;
  branchName: string;
  title: string;
  assignedChair: number;
  chairStationName: string;
  ratingAverage: number;
  totalReviews: number;
  isActive: boolean;
}

export interface ProvisionStaffInput {
  fullName: string;
  email: string;
  temporaryPassword: string;
  storeId: string;
  primaryRoleTitle: string;
  assignedChair: number;
  chairStationName: string;
  shiftDays: number[];
  shiftStart: string;
  shiftEnd: string;
}

export interface CloneServiceInput {
  sourceStoreId: string;
  targetStoreId: string;
}
