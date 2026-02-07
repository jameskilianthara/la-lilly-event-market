// Environment Variable Validation
// Ensures all required environment variables are present at application startup

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

const serverRequiredEnvVars = [
  'SUPABASE_SERVICE_ROLE_KEY', // Required for API routes
] as const;

const optionalEnvVars = [
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'NEXT_PUBLIC_APP_URL',
] as const;

/**
 * Validates that all required environment variables are present
 * Throws an error if any required variables are missing
 */
export function validateEnvironment(): void {
  const missing: string[] = [];

  // Always validate public env vars
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Validate server-only vars (only in Node.js environment)
  if (typeof window === 'undefined') {
    for (const varName of serverRequiredEnvVars) {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.\n' +
      'Note: SUPABASE_SERVICE_ROLE_KEY is required for API routes (server-side only).'
    );
  }
}

/**
 * Validates payment environment variables (Razorpay)
 * Call this only when payment features are needed
 */
export function validatePaymentEnv(): void {
  const required = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET'];
  const missing = required.filter(v => !process.env[v]);

  if (missing.length > 0) {
    throw new Error(
      `Missing payment environment variables: ${missing.join(', ')}\n` +
      'Payment features will not work without these variables.'
    );
  }
}

/**
 * Gets an environment variable with optional default value
 * @param name - Environment variable name
 * @param defaultValue - Optional default value if variable is not set
 * @returns Environment variable value or default
 */
export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${name} is not set and no default value provided`);
  }
  return value;
}

// Auto-validate on module import (only in server-side code, not during build)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
  // Only validate in development - production build doesn't have service key yet
  try {
    validateEnvironment();
  } catch (error) {
    console.warn('Environment validation warning:', error instanceof Error ? error.message : error);
  }
}















