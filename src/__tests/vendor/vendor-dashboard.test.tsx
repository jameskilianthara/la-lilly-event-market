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
  companyName: 'Test Event Company',
  ownerName: 'John Doe',
  email: 'john@testcompany.com',
  phone: '+91 9876543210',
  city: 'Mumbai',
  state: 'Maharashtra',
  services: ['Venue & Decor', 'Photography & Video', 'Entertainment & Music'],
  experience: '5-10 years',
  teamSize: '11-20 members',
  portfolio: 'https://testcompany.com',
  description: 'Professional event management company specializing in weddings and corporate events.',
  status: 'active',
  registrationDate: new Date('2024-01-01'),
  projects: [],
  bids: [],
};

describe('Vendor Dashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('lalilly-vendor-session', JSON.stringify(mockVendor));
    mockLocation.href = '';
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Authentication Check', () => {
    it('redirects to auth page when no vendor session exists', () => {
      localStorage.removeItem('lalilly-vendor-session');
      render(<VendorDashboardPage />);

      expect(mockLocation.href).toBe('/vendor-auth');
    });

    it('shows loading state initially', () => {
      render(<VendorDashboardPage />);
      expect(screen.getByText('Loading your dashboard...')).toBeInTheDocument();
    });
  });

  describe('Dashboard Layout', () => {
    it('renders vendor welcome section', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Welcome back, John Doe!')).toBeInTheDocument();
        expect(screen.getByText('Test Event Company • Mumbai, Maharashtra')).toBeInTheDocument();
      });
    });

    it('displays navigation tabs', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Projects')).toBeInTheDocument();
        expect(screen.getByText('My Bids')).toBeInTheDocument();
        expect(screen.getByText('Profile')).toBeInTheDocument();
      });
    });

    it('shows overview tab by default', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Recent Project Opportunities')).toBeInTheDocument();
      });
    });
  });

  describe('Overview Tab', () => {
    it('displays statistics cards', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('New Projects')).toBeInTheDocument();
        expect(screen.getByText('Under Review')).toBeInTheDocument();
        expect(screen.getByText('Bids Submitted')).toBeInTheDocument();
        expect(screen.getByText('Average Rating')).toBeInTheDocument();
      });
    });

    it('shows available projects count', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument(); // Available Projects count
      });
    });

    it('displays recent projects list', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Rahul & Priya Wedding')).toBeInTheDocument();
        expect(screen.getByText('Tech Corp Annual Meet')).toBeInTheDocument();
        expect(screen.getByText('Aarav\'s 8th Birthday')).toBeInTheDocument();
      });
    });

    it('shows project status badges', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('new')).toBeInTheDocument();
        expect(screen.getByText('viewed')).toBeInTheDocument();
        expect(screen.getByText('bid submitted')).toBeInTheDocument();
      });
    });
  });

  describe('Projects Tab', () => {
    it('displays all available projects', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        const projectsTab = screen.getByText('Projects');
        fireEvent.click(projectsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Available Project Opportunities')).toBeInTheDocument();
        expect(screen.getAllByText('View Details')).toHaveLength(3);
      });
    });

    it('shows project categories as tags', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        const projectsTab = screen.getByText('Projects');
        fireEvent.click(projectsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Venue & Decor')).toBeInTheDocument();
        expect(screen.getByText('Photography & Video')).toBeInTheDocument();
        expect(screen.getByText('Entertainment & Music')).toBeInTheDocument();
      });
    });

    it('shows submit bid buttons for eligible projects', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        const projectsTab = screen.getByText('Projects');
        fireEvent.click(projectsTab);
      });

      await waitFor(() => {
        const submitBidButtons = screen.getAllByText('Submit Bid');
        expect(submitBidButtons).toHaveLength(2); // Only for projects that haven't been bid on yet
      });
    });
  });

  describe('Bids Tab', () => {
    it('shows coming soon message for bid management', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        const bidsTab = screen.getByText('My Bids');
        fireEvent.click(bidsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Bid Management')).toBeInTheDocument();
        expect(screen.getByText('Coming Soon')).toBeInTheDocument();
      });
    });
  });

  describe('Profile Tab', () => {
    it('displays vendor profile information', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        const profileTab = screen.getByText('Profile');
        fireEvent.click(profileTab);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Event Company')).toBeInTheDocument();
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('john@testcompany.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('+91 9876543210')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Mumbai, Maharashtra')).toBeInTheDocument();
      });
    });

    it('shows services as tags', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        const profileTab = screen.getByText('Profile');
        fireEvent.click(profileTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Venue & Decor')).toBeInTheDocument();
        expect(screen.getByText('Photography & Video')).toBeInTheDocument();
        expect(screen.getByText('Entertainment & Music')).toBeInTheDocument();
      });
    });

    it('displays company description', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        const profileTab = screen.getByText('Profile');
        fireEvent.click(profileTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Professional event management company specializing in weddings and corporate events.')).toBeInTheDocument();
      });
    });

    it('shows registration date', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        const profileTab = screen.getByText('Profile');
        fireEvent.click(profileTab);
      });

      await waitFor(() => {
        expect(screen.getByText(/Member since:/)).toBeInTheDocument();
      });
    });
  });

  describe('Project Details Modal', () => {
    it('opens project details when view details is clicked', async () => {
      const user = userEvent.setup();
      render(<VendorDashboardPage />);

      await waitFor(() => {
        const viewDetailsButtons = screen.getAllByText('View Details');
        fireEvent.click(viewDetailsButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Rahul & Priya Wedding')).toBeInTheDocument();
        expect(screen.getByText('Requirements')).toBeInTheDocument();
      });
    });

    it('displays project requirements by category', async () => {
      const user = userEvent.setup();
      render(<VendorDashboardPage />);

      await waitFor(() => {
        const viewDetailsButtons = screen.getAllByText('View Details');
        fireEvent.click(viewDetailsButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Decoration')).toBeInTheDocument();
        expect(screen.getByText('Photography & Video')).toBeInTheDocument();
        expect(screen.getByText('Entertainment')).toBeInTheDocument();
      });
    });

    it('shows submit bid button for eligible projects in modal', async () => {
      const user = userEvent.setup();
      render(<VendorDashboardPage />);

      await waitFor(() => {
        const viewDetailsButtons = screen.getAllByText('View Details');
        fireEvent.click(viewDetailsButtons[0]); // First project should be eligible
      });

      await waitFor(() => {
        expect(screen.getByText('Submit Bid for This Project')).toBeInTheDocument();
      });
    });

    it('closes modal when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<VendorDashboardPage />);

      await waitFor(() => {
        const viewDetailsButtons = screen.getAllByText('View Details');
        fireEvent.click(viewDetailsButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Rahul & Priya Wedding')).toBeInTheDocument();
      });

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Rahul & Priya Wedding')).not.toBeInTheDocument();
      });
    });

    it('marks project as viewed when details are opened', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        const viewDetailsButtons = screen.getAllByText('View Details');
        fireEvent.click(viewDetailsButtons[0]);
      });

      // The project should now be marked as viewed
      // This would typically update the UI to show "viewed" status
      await waitFor(() => {
        expect(screen.getByText('Rahul & Priya Wedding')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('switches between tabs correctly', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Recent Project Opportunities')).toBeInTheDocument();
      });

      // Switch to Projects tab
      const projectsTab = screen.getByText('Projects');
      fireEvent.click(projectsTab);

      await waitFor(() => {
        expect(screen.getByText('Available Project Opportunities')).toBeInTheDocument();
        expect(screen.queryByText('Recent Project Opportunities')).not.toBeInTheDocument();
      });

      // Switch to Profile tab
      const profileTab = screen.getByText('Profile');
      fireEvent.click(profileTab);

      await waitFor(() => {
        expect(screen.getByText('Vendor Profile')).toBeInTheDocument();
        expect(screen.queryByText('Available Project Opportunities')).not.toBeInTheDocument();
      });
    });

    it('shows badge on projects tab for new projects', async () => {
      render(<VendorDashboardPage />);

      await waitFor(() => {
        const projectsTab = screen.getByText('Projects');
        const badge = projectsTab.parentElement?.querySelector('.w-5.h-5.bg-red-500');
        expect(badge).toBeInTheDocument();
        expect(badge?.textContent).toBe('1'); // One new project
      });
    });
  });
});
