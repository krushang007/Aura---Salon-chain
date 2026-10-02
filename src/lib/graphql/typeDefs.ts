export const typeDefs = /* GraphQL */ `
  enum UserRole {
    TENANT_ADMIN
    STAFF
    CUSTOMER
  }

  enum AppointmentStatus {
    BOOKED
    CONFIRMED
    IN_PROGRESS
    COMPLETED
    CANCELLED
    NO_SHOW
    RESCHEDULE_NEEDED
  }

  type Tenant {
    id: ID!
    name: String!
    slug: String!
    createdAt: String!
  }

  type User {
    id: ID!
    email: String!
    fullName: String!
    role: UserRole!
    phone: String
    isActive: Boolean!
  }

  type Store {
    id: ID!
    name: String!
    city: String!
    address: String
    timezone: String!
    openingTime: String!
    closingTime: String!
    weeklyOffDay: Int
    totalStylingChairs: Int!
    services: [Service!]!
    staff: [StaffProfile!]!
  }

  type Service {
    id: ID!
    storeId: ID!
    title: String!
    description: String
    durationMinutes: Int!
    bufferMinutes: Int!
    price: Float!
    isActive: Boolean!
  }

  type StaffProfile {
    id: ID!
    user: User
    currentStoreId: ID!
    title: String
    isActive: Boolean!
  }

  type TimeSlot {
    startTime: String!
    endTime: String!
  }

  type Appointment {
    id: ID!
    storeId: ID!
    staffId: ID!
    customerId: ID!
    serviceId: ID!
    slotRange: String!
    status: AppointmentStatus!
    customerNotes: String
    createdAt: String!
  }

  type SystemHealth {
    status: String!
    database: String!
    timestamp: String!
    version: String!
  }

  type Query {
    systemHealth: SystemHealth!
    stores(city: String): [Store!]!
    store(id: ID!): Store
    services(storeId: ID!): [Service!]!
    staff(storeId: ID!): [StaffProfile!]!
    availableSlots(storeId: ID!, staffId: ID!, serviceId: ID!, date: String!): [TimeSlot!]!
    appointments(storeId: ID, customerId: ID): [Appointment!]!
  }

  type Mutation {
    createAppointment(
      storeId: ID!
      staffId: ID!
      serviceId: ID!
      customerId: ID!
      startTime: String!
      customerNotes: String
    ): Appointment!

    updateAppointmentStatus(
      appointmentId: ID!
      status: AppointmentStatus!
    ): Appointment!

    cloneServices(
      sourceStoreId: ID!
      targetStoreId: ID!
    ): [Service!]!
  }
`;
