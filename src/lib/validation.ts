// src/lib/validation.ts
import { z } from 'zod';

// Auth validation schemas
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
  userType: z.enum(['client', 'vendor']),
  name: z.string().optional(),
  companyName: z.string().optional(),
  phone: z.string().optional(),
});

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

// Bid validation schema
export const bidSchema = z.object({
  event_id: z.string().min(1, 'Event ID is required'),
  vendor_id: z.string().min(1, 'Vendor ID is required'),
  totalAmount: z
    .number()
    .positive('Bid amount must be greater than zero')
    .max(10000000, 'Bid amount seems too high'),
  proposal: z
    .string()
    .min(10, 'Proposal must be at least 10 characters')
    .max(5000, 'Proposal must be less than 5000 characters'),
  breakdown: z.string().optional(),
});

// Event creation schema
export const eventSchema = z.object({
  title: z
    .string()
    .min(3, 'Event title must be at least 3 characters')
    .max(100, 'Event title must be less than 100 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  eventType: z.string().min(1, 'Event type is required'),
  guestCount: z
    .number()
    .int()
    .min(1, 'At least 1 guest is required')
    .max(10000, 'Guest count seems too high'),
  budget: z
    .number()
    .positive('Budget must be greater than zero')
    .max(50000000, 'Budget seems too high'),
  eventDate: z
    .date()
    .refine((date) => date > new Date(), 'Event date must be in the future'),
  location: z.string().min(3, 'Location must be at least 3 characters'),
});

// Payment validation schema
export const paymentSchema = z.object({
  contractId: z.string().min(1, 'Contract ID is required'),
  userId: z.string().min(1, 'User ID is required'),
});

// Contact/Support schemas
export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

// Type exports
export type LoginForm = z.infer<typeof loginSchema>;
export type SignupForm = z.infer<typeof signupSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
export type BidForm = z.infer<typeof bidSchema>;
export type EventForm = z.infer<typeof eventSchema>;
export type PaymentForm = z.infer<typeof paymentSchema>;
export type ContactForm = z.infer<typeof contactSchema>;

// Validation helper functions
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true;
  data: T;
} | {
  success: false;
  errors: Record<string, string>;
} {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((err) => {
        if (err.path.length > 0) {
          errors[err.path[0] as string] = err.message;
        }
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
}

// Safe validation that doesn't throw
export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  try {
    return schema.parse(data);
  } catch {
    return null;
  }
}









