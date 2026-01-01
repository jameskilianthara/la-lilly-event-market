// src/lib/errors.ts

export class EventFoundryError extends Error {
  public code: string;
  public statusCode: number;

  constructor(message: string, code: string, statusCode = 500) {
    super(message);
    this.name = 'EventFoundryError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ValidationError extends EventFoundryError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends EventFoundryError {
  constructor(message: string) {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class PaymentError extends EventFoundryError {
  constructor(message: string) {
    super(message, 'PAYMENT_ERROR', 402);
    this.name = 'PaymentError';
  }
}

export class DatabaseError extends EventFoundryError {
  constructor(message: string) {
    super(message, 'DATABASE_ERROR', 500);
    this.name = 'DatabaseError';
  }
}

// Error message templates
export const ERROR_MESSAGES = {
  INVALID_EMAIL: 'Please enter a valid email address',
  WEAK_PASSWORD: 'Password must be at least 8 characters long',
  USER_NOT_FOUND: 'User not found',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EVENT_NOT_FOUND: 'Event not found',
  BID_DEADLINE_PASSED: 'Bidding deadline has passed for this event',
  INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action',
  PAYMENT_FAILED: 'Payment could not be processed. Please try again',
  NETWORK_ERROR: 'Network error. Please check your connection and try again',
  GENERIC_ERROR: 'Something went wrong. Please try again',
} as const;

// User-friendly error messages
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof EventFoundryError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    // Map technical errors to user-friendly messages
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    
    if (message.includes('unauthorized') || message.includes('auth')) {
      return ERROR_MESSAGES.INVALID_CREDENTIALS;
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return ERROR_MESSAGES.INVALID_EMAIL;
    }
  }
  
  return ERROR_MESSAGES.GENERIC_ERROR;
}

// Error logging utility
export function logError(error: unknown, context?: Record<string, any>) {
  const errorInfo = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
  };

  console.error('EventFoundry Error:', errorInfo);
  
  // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
  // await sendToErrorTracking(errorInfo);
}


