import { z } from 'zod';
import { NextResponse } from 'next/server';

// ============================================================================
// SHARED PRIMITIVES
// ============================================================================

const uuidSchema = z.string().uuid('Must be a valid UUID');
const emailSchema = z.string().email('Must be a valid email').transform((v) => v.toLowerCase().trim());
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().min(1, 'Name is required').max(150).transform((v) => v.trim());
const phoneSchema = z.string().max(30).transform((v) => v.trim()).optional().nullable();
const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM format');
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format');

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
  code: z.string().length(4, 'Code must be 4 digits').optional(),
  newPassword: passwordSchema,
});

export const profileUpdateSchema = z.object({
  fullName: nameSchema,
  phone: phoneSchema,
});

// ============================================================================
// BOOKING SCHEMAS
// ============================================================================

export const bookingCreateSchema = z.object({
  storeId: uuidSchema,
  staffId: uuidSchema,
  serviceId: uuidSchema,
  date: dateSchema,
  slotTime: timeSchema,
  customerNotes: z.string().max(500).optional().nullable(),
});

export const bookingCancelSchema = z.object({
  appointmentId: uuidSchema,
  reason: z.string().max(500).optional(),
});

export const bookingRescheduleSchema = z.object({
  appointmentId: uuidSchema,
  newDate: dateSchema,
  newSlotTime: timeSchema,
  newStaffId: uuidSchema.optional(),
});

// ============================================================================
// STAFF SCHEMAS
// ============================================================================

export const staffStatusUpdateSchema = z.object({
  appointmentId: uuidSchema,
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'NO_SHOW']),
});

export const staffQuickBookSchema = z.object({
  storeId: uuidSchema,
  staffId: uuidSchema,
  serviceId: uuidSchema,
  customerFullName: nameSchema,
  customerPhone: phoneSchema,
  customerEmail: emailSchema.optional().nullable(),
  customerId: uuidSchema.optional().nullable(),
  startTime: z.string().min(1, 'Start time is required'),
  customerNotes: z.string().max(500).optional().nullable(),
});

// ============================================================================
// ADMIN SCHEMAS
// ============================================================================

export const adminProvisionSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  temporaryPassword: z.string().min(6).default('Password@123'),
  storeId: uuidSchema,
  primaryRoleTitle: z.string().max(100).default('Senior Stylist'),
  assignedChair: z.number().int().positive().default(2),
  chairStationName: z.string().max(50).default('Chair 02'),
  shiftDays: z.array(z.number().int().min(0).max(6)).default([1, 2, 3, 4, 5]),
  shiftStart: z.string().default('09:00:00'),
  shiftEnd: z.string().default('18:00:00'),
});

export const adminOutletCreateSchema = z.object({
  branchName: nameSchema,
  locality: z.string().min(1, 'Locality is required').max(100).transform((v) => v.trim()),
  address: z.string().min(1, 'Address is required').max(500).transform((v) => v.trim()),
  phone: z.string().min(1, 'Phone is required').max(30).transform((v) => v.trim()),
  totalStylingChairs: z.number().int().positive().default(5),
  openingTime: z.string().default('09:00:00'),
  closingTime: z.string().default('21:00:00'),
  autoSeedCatalog: z.boolean().default(true),
});

export const adminOutletUpdateSchema = z.object({
  storeId: uuidSchema,
  branchName: z.string().max(150).optional(),
  locality: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  phone: z.string().max(30).optional(),
  totalStylingChairs: z.number().int().positive().optional(),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
  isActive: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

export const adminStaffUpdateSchema = z.object({
  staffId: uuidSchema,
  fullName: z.string().max(150).optional(),
  title: z.string().max(100).optional(),
  assignedChair: z.number().int().positive().optional(),
  storeId: uuidSchema.optional(),
  newPassword: z.string().min(6).optional(),
  isActive: z.boolean().optional(),
});

export const cloneServicesSchema = z.object({
  sourceStoreId: z.string().min(1, 'sourceStoreId is required'),
  targetStoreId: uuidSchema,
});

// ============================================================================
// NOTIFICATION SCHEMAS
// ============================================================================

export const notificationUpdateSchema = z.object({
  notificationId: uuidSchema.optional(),
  markAllAsRead: z.boolean().optional(),
}).refine(
  (data) => data.notificationId || data.markAllAsRead,
  { message: 'notificationId or markAllAsRead is required' }
);

// ============================================================================
// PARTNER SCHEMAS
// ============================================================================

export const partnerRegisterSchema = z.object({
  salonName: nameSchema,
  ownerName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  locality: z.string().min(1, 'Locality is required').max(100).transform((v) => v.trim()),
  address: z.string().max(500).optional(),
  phone: phoneSchema,
  totalStylingChairs: z.number().int().positive().default(5),
});

// ============================================================================
// VALIDATION HELPER
// ============================================================================

/**
 * Parses a request body against a Zod schema.
 * Returns the parsed data or a structured 400 NextResponse with field-level errors.
 */
export async function validateRequestBody<T extends z.ZodType>(
  request: Request,
  schema: T
): Promise<{ data: z.infer<T> } | { error: NextResponse }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data };
  } catch (err) {
    if (err instanceof z.ZodError) {
      const fieldErrors = err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return {
        error: NextResponse.json(
          { error: 'Validation failed', details: fieldErrors },
          { status: 400 }
        ),
      };
    }
    return {
      error: NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      ),
    };
  }
}
