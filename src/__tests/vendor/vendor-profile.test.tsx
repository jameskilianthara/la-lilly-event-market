import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import VendorDashboardPage from '../../app/vendor-dashboard/page';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.location
const mockLocation = {
  href: '',
  reload: vi.fn(),
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
});

const mockVendor = {
  id: 'company-123',
  companyName: 'Elegant Events Mumbai',
  ownerName: 'Rahul Sharma',
  email: 'rahul@elegantevents.com',
  phone: '+91 9876543210',
  city: 'Mumbai',
  state: 'Maharashtra',
  services: ['Venue & Decor', 'Photography & Video', 'Entertainment & Music'],
  experience: '5-10 years',
  teamSize: '11-20 members',
  portfolio: 'https://elegantevents.com',
  description: 'Professional event management company specializing in luxury weddings and corporate events. We have successfully managed over 150 events with a 4.8-star rating.',
  status: 'active',
  registrationDate: new Date('2024-01-15'),
  projects: [],
  bids: [],
};

describe('Vendor Profile Management', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('lalilly-vendor-session', JSON.stringify(mockVendor));
    mockLocation.href = '';
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Profile Tab Access', () => {
    it('displays profile tab in dashboard navigation', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument();
      });
    });

    it('shows profile content when profile tab is clicked', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        const profileTab = screen.getByText('Profile');
        fireEvent.click(profileTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Vendor Profile')).toBeInTheDocument();
        expect(screen.getByText('Elegant Events Mumbai')).toBeInTheDocument();
      });
    });
  });

  describe('Profile Information Display', () => {
    it('displays all vendor information fields', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        const profileTab = screen.getByText('Profile');
        fireEvent.click(profileTab);
      });

      await waitFor(() => {
        // Company Information
        expect(screen.getByDisplayValue('Elegant Events Mumbai')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Rahul Sharma')).toBeInTheDocument();
        expect(screen.getByDisplayValue('rahul@elegantevents.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('+91 9876543210')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Mumbai, Maharashtra')).toBeInTheDocument();

        // Services
        expect(screen.getByText('Venue & Decor')).toBeInTheDocument();
        expect(screen.getByText('Photography & Video')).toBeInTheDocument();
        expect(screen.getByText('Entertainment & Music')).toBeInTheDocument();

        // Description
        expect(screen.getByText('Professional event management company specializing in luxury weddings and corporate events. We have successfully managed over 150 events with a 4.8-star rating.')).toBeInTheDocument();
      });
    });

    it('shows experience and team size information', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        const profileTab = screen.getByText('Profile');
        fireEvent.click(profileTab);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('5-10 years')).toBeInTheDocument();
        expect(screen.getByDisplayValue('11-20 members')).toBeInTheDocument();
      });
    });

    it('displays registration date', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        const profileTab = screen.getByText('Profile');
        fireEvent.click(profileTab);
      });

      await waitFor(() => {
        expect(screen.getByText(/Member since:/)).toBeInTheDocument();
        expect(screen.getByText('January 15, 2024')).toBeInTheDocument();
      });
    });
  });

  describe('Profile Field Labels', () => {
    it('shows appropriate labels for all fields', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        const profileTab = screen.getByText('Profile');
        fireEvent.click(profileTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Company Name')).toBeInTheDocument();
        expect(screen.getByText('Owner Name')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByText('Phone')).toBeInTheDocument();
        expect(screen.getByText('Location')).toBeInTheDocument();
        expect(screen.getByText('Experience')).toBeInTheDocument();
        expect(screen.getByText('Services Offered')).toBeInTheDocument();
        expect(screen.getByText('Business Description')).toBeInTheDocument();
      });
    });
  });

  describe('Services Display', () => {
    it('displays services as styled tags', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        const profileTab = screen.getByText('Profile');
        fireEvent.click(profileTab);
      });

      await waitFor(() => {
        const serviceTags = screen.getAllByText(/Venue & Decor|Photography & Video|Entertainment & Music/);
        expect(serviceTags).toHaveLength(3);

        // Check that they have the correct styling (blue background)
        serviceTags.forEach(tag => {
          expect(tag).toHaveClass('bg-blue-100');
          expect(tag).toHaveClass('text-blue-700');
        });
      });
    });

    it('handles vendors with no services', async () => {
      const vendorNoServices = {
        ...mockVendor,
        services: [],
      };

      localStorage.setItem('lalilly-vendor-session', JSON.stringify(vendorNoServices));

      render(<VendorDashboardPage />);

      await waitFor(() => {
        const profileTab = screen.getByText('Profile');
        fireEvent.click(profileTab);
      });

      await waitFor(() => {
        // Should not show any service tags
        const serviceTags = screen.queryAllByText(/Venue & Decor|Photography & Video|Entertainment & Music/);
        expect(serviceTags).toHaveLength(0);
      });
    });
  });

  describe('Read-Only Fields', () => {
    it('makes all profile fields read-only', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        const profileTab = screen.getByText('Profile');
        fireEvent.click(profileTab);
      });

      await waitFor(() => {
        // All input fields should be read-only
        const inputs = screen.getAllByRole('textbox');
        inputs.forEach(input => {
          expect(input).toHaveAttribute('readonly');
        });

        // Textarea should also be read-only
        const textarea = screen.getByRole('textbox', { hidden: true }); // Textarea is detected as textbox
        expect(textarea).toHaveAttribute('readonly');
      });
    });

    it('prevents editing of profile information', async () => {
      const user = userEvent.setup();
      render(<VendorDashboardPage />);

      await waitFor(() => {
        const profileTab = screen.getByText('Profile');
        fireEvent.click(profileTab);
      });

      await waitFor(() => {
        const companyNameInput = screen.getByDisplayValue('Elegant Events Mumbai');

        // Try to type in the field
        fireEvent.change(companyNameInput, { target: { value: 'New Company Name' } });

        // Value should remain unchanged
        expect(companyNameInput).toHaveValue('Elegant Events Mumbai');
      });
    });
  });

  describe('Profile Data Integrity', () => {
    it('loads profile data from localStorage session', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        const profileTab = screen.getByText('Profile');
        fireEvent.click(profileTab);
      });

      await waitFor(() => {
        // Verify data matches what's stored in localStorage
        const storedSession = JSON.parse(localStorage.getItem('lalilly-vendor-session') || '{}');
        expect(screen.getByDisplayValue(storedSession.companyName)).toBeInTheDocument();
        expect(screen.getByDisplayValue(storedSession.ownerName)).toBeInTheDocument();
        expect(screen.getByDisplayValue(storedSession.email)).toBeInTheDocument();
      });
    });

    it('handles missing optional fields gracefully', async () => {
      const vendorMinimal = {
        ...mockVendor,
        experience: undefined,
        portfolio: undefined,
        description: undefined,
      };

      localStorage.setItem('lalilly-vendor-session', JSON.stringify(vendorMinimal));

      render(<VendorDashboardPage />);

      await waitFor(() => {
        const profileTab = screen.getByText('Profile');
        fireEvent.click(profileTab);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Not specified')).toBeInTheDocument();
        expect(screen.queryByText('Business Description')).not.toBeInTheDocument();
      });
    });
  });

  describe('Profile Layout and Styling', () => {
    it('uses consistent styling with dashboard', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        const profileTab = screen.getByText('Profile');
        fireEvent.click(profileTab);
      });

      await waitFor(() => {
        // Check for consistent dashboard styling
        const profileSection = screen.getByText('Vendor Profile').closest('.bg-white');
        expect(profileSection).toBeInTheDocument();
        expect(profileSection).toHaveClass('rounded-2xl');
        expect(profileSection).toHaveClass('border');
        expect(profileSection).toHaveClass('border-neutral-200');
      });
    });

    it('organizes fields in logical groups', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        const profileTab = screen.getByText('Profile');
        fireEvent.click(profileTab);
      });

      await waitFor(() => {
        // Fields should be organized in a grid layout
        const gridContainer = screen.getByDisplayValue('Elegant Events Mumbai').closest('.grid');
        expect(gridContainer).toBeInTheDocument();
      });
    });
  });

  describe('Profile Completion Status (Future)', () => {
    it('will eventually show profile completion percentage', async () => {
      // Future test for profile completion widget
      render(<VendorDashboardPage />);

      await waitFor(() => {
        const profileTab = screen.getByText('Profile');
        fireEvent.click(profileTab);
      });

      // Will eventually test:
      // - Profile completion progress bar
      // - Missing information alerts
      // - Suggestions for profile improvement
      expect(screen.getByText('Vendor Profile')).toBeInTheDocument();
    });

    it('will eventually allow profile editing', async () => {
      // Future test for profile editing functionality
      render(<VendorDashboardPage />);

      await waitFor(() => {
        const profileTab = screen.getByText('Profile');
        fireEvent.click(profileTab);
      });

      // Will eventually test:
      // - Edit buttons for each field
      // - Save/cancel functionality
      // - Profile photo upload
      // - Portfolio image management
      expect(screen.getByText('Vendor Profile')).toBeInTheDocument();
    });
  });

  describe('Profile Analytics (Future)', () => {
    it('will eventually show profile view statistics', async () => {
      // Future test for profile analytics
      render(<VendorDashboardPage />);

      await waitFor(() => {
        const profileTab = screen.getByText('Profile');
        fireEvent.click(profileTab);
      });

      // Will eventually test:
      // - Profile view count
      // - Client inquiries
      // - Response rate
      // - Average response time
      expect(screen.getByText('Vendor Profile')).toBeInTheDocument();
    });
  });
});
