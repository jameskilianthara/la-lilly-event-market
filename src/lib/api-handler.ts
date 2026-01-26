// src/lib/api-handler.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserFriendlyErrorMessage, logError, EventFoundryError, ValidationError, AuthenticationError } from './errors';

type ApiHandler = (req: NextRequest, context?: any) => Promise<NextResponse>;

export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, context?: any) => {
    try {
      return await handler(req, context);
    } catch (error) {
      logError(error, {
        method: req.method,
        url: req.url,
        headers: Object.fromEntries(req.headers.entries()),
      });

      if (error instanceof EventFoundryError) {
        return NextResponse.json(
          { 
            error: error.message,
            code: error.code 
          },
          { status: error.statusCode }
        );
      }

      const userMessage = getUserFriendlyErrorMessage(error);
      
      return NextResponse.json(
        { 
          error: userMessage,
          code: 'INTERNAL_ERROR' 
        },
        { status: 500 }
      );
    }
  };
}

// Validation helper
export function validateRequired<T>(data: T, fields: (keyof T)[]): void {
  for (const field of fields) {
    if (!data[field]) {
      throw new ValidationError(`${String(field)} is required`);
    }
  }
}

// Authentication helper
export function requireAuth(userId?: string): string {
  if (!userId) {
    throw new AuthenticationError('Authentication required');
  }
  return userId;
}


