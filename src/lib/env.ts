// Environment Variable Validation
// Ensures all required environment variables are present at application startup

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

const optionalEnvVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
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

  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
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

// Auto-validate on module import (only in server-side code)
if (typeof window === 'undefined') {
  validateEnvironment();
}


