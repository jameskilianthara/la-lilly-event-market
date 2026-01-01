// src/test/utils.tsx
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock user data
export const mockUser = {
  userId: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  userType: 'client' as const,
  isAuthenticated: true as const,
  persistent: true,
  loginTime: new Date().toISOString(),
  expiresAt: null,
};

export const mockVendor = {
  userId: 'test-vendor-id',
  email: 'vendor@example.com',
  userType: 'vendor' as const,
  companyName: 'Test Catering Co',
  isAuthenticated: true as const,
  persistent: true,
  loginTime: new Date().toISOString(),
  expiresAt: null,
};

// Mock event data
export const mockEvent = {
  id: 'test-event-id',
  title: 'Test Wedding',
  event_type: 'wedding',
  date: '2025-06-15',
  guest_count: 150,
  city: 'Mumbai',
  forge_status: 'OPEN_FOR_BIDS',
  client_id: 'test-user-id',
};

// Mock bid data
export const mockBid = {
  id: 'test-bid-id',
  event_id: 'test-event-id',
  vendor_id: 'test-vendor-id',
  total_forge_cost: 500000,
  status: 'PENDING',
  service_details: 'Complete catering service',
};

// Custom render with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };


