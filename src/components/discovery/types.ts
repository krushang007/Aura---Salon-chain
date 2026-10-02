export interface SalonStoreSummary {
  id: string;
  tenantName: string;
  branchName: string;
  city: string;
  locality: string;
  address: string;
  phone: string;
  openingTime: string;
  closingTime: string;
  totalStylingChairs: number;
  ratingAverage: number;
  totalReviews: number;
  featuredService?: {
    title: string;
    durationMinutes: number;
    price: number;
  };
}

export interface DiscoveryFilters {
  locality: string;
  category: string;
  searchQuery: string;
}
