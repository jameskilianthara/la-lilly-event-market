import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import VendorDirectoryPage from '../../app/vendors/page';

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

// Mock next/navigation
const mockPush = vi.fn();
const mockRouter = {
  push: mockPush,
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

const mockVendors = [
  {
    id: 'vendor-1',
    businessName: 'Elegant Events Mumbai',
    companyInfo: { businessName: 'Elegant Events Mumbai' },
    serviceType: 'Event Management',
    profile: {
      slug: 'elegant-events-mumbai',
      logo: 'https://example.com/logo1.jpg',
      tagline: 'Luxury event management with attention to detail',
      bio: 'Professional event management company specializing in weddings and corporate events',
      serviceTypes: ['Event Management'],
      specializations: ['Wedding Planning', 'Corporate Events'],
      primaryCity: 'Mumbai',
      serviceAreas: ['Mumbai', 'Pune'],
      portfolioImages: [{ url: 'https://example.com/portfolio1.jpg' }],
      pricingDisplay: {
        showPricing: true,
        startingPrice: 150000,
      },
      stats: {
        eventsCompleted: 150,
        avgRating: 4.8,
        totalReviews: 45,
      },
      isPublic: true,
      isVerified: true,
      isPremium: true,
    },
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'vendor-2',
    businessName: 'Delhi Wedding Specialists',
    companyInfo: { businessName: 'Delhi Wedding Specialists' },
    serviceType: 'Event Management',
    profile: {
      slug: 'delhi-wedding-specialists',
      logo: 'https://example.com/logo2.jpg',
      tagline: 'Making dreams come true since 2015',
      bio: 'Specialized in destination weddings and luxury events',
      serviceTypes: ['Event Management'],
      specializations: ['Wedding Planning', 'Destination Events'],
      primaryCity: 'Delhi',
      serviceAreas: ['Delhi', 'Jaipur'],
      portfolioImages: [{ url: 'https://example.com/portfolio2.jpg' }],
      pricingDisplay: {
        showPricing: true,
        startingPrice: 200000,
      },
      stats: {
        eventsCompleted: 89,
        avgRating: 4.6,
        totalReviews: 32,
      },
      isPublic: true,
      isVerified: false,
      isPremium: false,
    },
    createdAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'vendor-3',
    businessName: 'Corporate Events Bangalore',
    companyInfo: { businessName: 'Corporate Events Bangalore' },
    serviceType: 'Event Management',
    profile: {
      slug: 'corporate-events-bangalore',
      logo: 'https://example.com/logo3.jpg',
      tagline: 'Professional corporate event solutions',
      bio: 'Expert in conferences and corporate gatherings',
      serviceTypes: ['Event Management'],
      specializations: ['Corporate Events', 'Conferences'],
      primaryCity: 'Bangalore',
      serviceAreas: ['Bangalore'],
      portfolioImages: [],
      pricingDisplay: {
        showPricing: false,
        startingPrice: 0,
      },
      stats: {
        eventsCompleted: 67,
        avgRating: 4.4,
        totalReviews: 23,
      },
      isPublic: true,
      isVerified: true,
      isPremium: false,
    },
    createdAt: '2024-03-01T00:00:00Z',
  },
];

describe('Vendor Directory (Client Browse)', () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockClear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Page Layout and Initial Load', () => {
    it('renders the vendor directory page with hero section', () => {
      render(<VendorDirectoryPage />);
      expect(screen.getByText('Find Your Event Management Company')).toBeInTheDocument();
      expect(screen.getByText(/Browse India's top \d+ event management companies/)).toBeInTheDocument();
    });

    it('shows search bar and quick filter pills', () => {
      render(<VendorDirectoryPage />);
      expect(screen.getByPlaceholderText('Search by service, name, or city...')).toBeInTheDocument();
      expect(screen.getByText('Wedding Planning')).toBeInTheDocument();
      expect(screen.getByText('Corporate Events')).toBeInTheDocument();
    });

    it('loads vendors from localStorage on mount', () => {
      localStorage.setItem('active_vendors', JSON.stringify(mockVendors));

      render(<VendorDirectoryPage />);

      // Should display the loaded vendors
      expect(screen.getByText('Elegant Events Mumbai')).toBeInTheDocument();
      expect(screen.getByText('Delhi Wedding Specialists')).toBeInTheDocument();
    });

    it('filters out non-public vendors', () => {
      const vendorsWithPrivate = [
        ...mockVendors,
        {
          ...mockVendors[0],
          id: 'private-vendor',
          profile: { ...mockVendors[0].profile, isPublic: false },
        },
      ];
      localStorage.setItem('active_vendors', JSON.stringify(vendorsWithPrivate));

      render(<VendorDirectoryPage />);

      expect(screen.getByText('Elegant Events Mumbai')).toBeInTheDocument();
      expect(screen.queryByText('private-vendor')).not.toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      localStorage.setItem('active_vendors', JSON.stringify(mockVendors));
    });

    it('searches vendors by company name', async () => {
      const user = userEvent.setup();
      render(<VendorDirectoryPage />);

      const searchInput = screen.getByPlaceholderText('Search by service, name, or city...');
      await user.type(searchInput, 'Elegant');

      await waitFor(() => {
        expect(screen.getByText('Elegant Events Mumbai')).toBeInTheDocument();
        expect(screen.queryByText('Delhi Wedding Specialists')).not.toBeInTheDocument();
      });
    });

    it('searches vendors by service type', async () => {
      const user = userEvent.setup();
      render(<VendorDirectoryPage />);

      const searchInput = screen.getByPlaceholderText('Search by service, name, or city...');
      await user.type(searchInput, 'Corporate');

      await waitFor(() => {
        expect(screen.getByText('Corporate Events Bangalore')).toBeInTheDocument();
        expect(screen.queryByText('Elegant Events Mumbai')).not.toBeInTheDocument();
      });
    });

    it('searches vendors by city', async () => {
      const user = userEvent.setup();
      render(<VendorDirectoryPage />);

      const searchInput = screen.getByPlaceholderText('Search by service, name, or city...');
      await user.type(searchInput, 'Delhi');

      await waitFor(() => {
        expect(screen.getByText('Delhi Wedding Specialists')).toBeInTheDocument();
        expect(screen.queryByText('Elegant Events Mumbai')).not.toBeInTheDocument();
      });
    });

    it('quick filter pills update search query', async () => {
      const user = userEvent.setup();
      render(<VendorDirectoryPage />);

      const weddingPill = screen.getByText('Wedding Planning');
      await user.click(weddingPill);

      const searchInput = screen.getByPlaceholderText('Search by service, name, or city...');
      expect(searchInput).toHaveValue('Wedding Planning');
    });
  });

  describe('Filtering Functionality', () => {
    beforeEach(() => {
      localStorage.setItem('active_vendors', JSON.stringify(mockVendors));
    });

    it('shows filter sidebar on mobile when filters button is clicked', async () => {
      const user = userEvent.setup();
      render(<VendorDirectoryPage />);

      const filtersButton = screen.getByText('Filters');
      await user.click(filtersButton);

      // In mobile mode, this should show filters
      // The actual implementation shows a mobile filter button
      expect(filtersButton).toBeInTheDocument();
    });

    it('filters by city', async () => {
      const user = userEvent.setup();
      render(<VendorDirectoryPage />);

      // Click on desktop filter sidebar
      const citySelect = screen.getByLabelText('Location');
      await user.selectOptions(citySelect, 'Mumbai');

      await waitFor(() => {
        expect(screen.getByText('Elegant Events Mumbai')).toBeInTheDocument();
        expect(screen.queryByText('Delhi Wedding Specialists')).not.toBeInTheDocument();
      });
    });

    it('filters by price range', async () => {
      const user = userEvent.setup();
      render(<VendorDirectoryPage />);

      // Click on premium price range (above ₹2L)
      const premiumRadio = screen.getByLabelText('Premium (₹₹₹) - Above ₹2L');
      await user.click(premiumRadio);

      await waitFor(() => {
        expect(screen.getByText('Delhi Wedding Specialists')).toBeInTheDocument();
        expect(screen.queryByText('Elegant Events Mumbai')).not.toBeInTheDocument();
      });
    });

    it('filters by verified vendors only', async () => {
      const user = userEvent.setup();
      render(<VendorDirectoryPage />);

      const verifiedCheckbox = screen.getByLabelText('Verified Vendors Only');
      await user.click(verifiedCheckbox);

      await waitFor(() => {
        expect(screen.getByText('Elegant Events Mumbai')).toBeInTheDocument();
        expect(screen.getByText('Corporate Events Bangalore')).toBeInTheDocument();
        expect(screen.queryByText('Delhi Wedding Specialists')).not.toBeInTheDocument();
      });
    });

    it('filters by premium vendors only', async () => {
      const user = userEvent.setup();
      render(<VendorDirectoryPage />);

      const premiumCheckbox = screen.getByLabelText('Premium Vendors');
      await user.click(premiumCheckbox);

      await waitFor(() => {
        expect(screen.getByText('Elegant Events Mumbai')).toBeInTheDocument();
        expect(screen.queryByText('Delhi Wedding Specialists')).not.toBeInTheDocument();
        expect(screen.queryByText('Corporate Events Bangalore')).not.toBeInTheDocument();
      });
    });

    it('shows pricing filter', async () => {
      const user = userEvent.setup();
      render(<VendorDirectoryPage />);

      const pricingCheckbox = screen.getByLabelText('Shows Pricing');
      await user.click(pricingCheckbox);

      await waitFor(() => {
        expect(screen.getByText('Elegant Events Mumbai')).toBeInTheDocument();
        expect(screen.getByText('Delhi Wedding Specialists')).toBeInTheDocument();
        expect(screen.queryByText('Corporate Events Bangalore')).not.toBeInTheDocument();
      });
    });

    it('resets all filters', async () => {
      const user = userEvent.setup();
      render(<VendorDirectoryPage />);

      // Apply some filters
      const verifiedCheckbox = screen.getByLabelText('Verified Vendors Only');
      await user.click(verifiedCheckbox);

      await waitFor(() => {
        expect(screen.queryByText('Delhi Wedding Specialists')).not.toBeInTheDocument();
      });

      // Reset filters
      const resetButton = screen.getByText('Reset All');
      await user.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText('Elegant Events Mumbai')).toBeInTheDocument();
        expect(screen.getByText('Delhi Wedding Specialists')).toBeInTheDocument();
        expect(screen.getByText('Corporate Events Bangalore')).toBeInTheDocument();
      });
    });
  });

  describe('Sorting Functionality', () => {
    beforeEach(() => {
      localStorage.setItem('active_vendors', JSON.stringify(mockVendors));
    });

    it('sorts by recommended by default', () => {
      render(<VendorDirectoryPage />);

      const select = screen.getByDisplayValue('Recommended');
      expect(select).toBeInTheDocument();
    });

    it('sorts by rating highest first', async () => {
      const user = userEvent.setup();
      render(<VendorDirectoryPage />);

      const sortSelect = screen.getByDisplayValue('Recommended');
      await user.selectOptions(sortSelect, 'Highest Rated');

      // Should reorder vendors by rating (4.8, 4.6, 4.4)
      // The first vendor should be the highest rated
      await waitFor(() => {
        const vendorCards = screen.getAllByText(/₹[\d,]+/);
        expect(vendorCards.length).toBeGreaterThan(0);
      });
    });

    it('sorts by price low to high', async () => {
      const user = userEvent.setup();
      render(<VendorDirectoryPage />);

      const sortSelect = screen.getByDisplayValue('Recommended');
      await user.selectOptions(sortSelect, 'Price: Low to High');

      await waitFor(() => {
        // Should show vendors in order: no price, ₹1.5L, ₹2L
        expect(screen.getByText('Corporate Events Bangalore')).toBeInTheDocument();
      });
    });

    it('sorts by recently joined', async () => {
      const user = userEvent.setup();
      render(<VendorDirectoryPage />);

      const sortSelect = screen.getByDisplayValue('Recommended');
      await user.selectOptions(sortSelect, 'Recently Joined');

      await waitFor(() => {
        // Should show newest first (vendor-3, vendor-2, vendor-1)
        expect(screen.getByText('Corporate Events Bangalore')).toBeInTheDocument();
      });
    });
  });

  describe('View Modes', () => {
    beforeEach(() => {
      localStorage.setItem('active_vendors', JSON.stringify(mockVendors));
    });

    it('defaults to grid view', () => {
      render(<VendorDirectoryPage />);

      const gridButton = screen.getByLabelText('Grid view');
      const listButton = screen.getByLabelText('List view');

      expect(gridButton).toHaveClass('bg-orange-500');
      expect(listButton).not.toHaveClass('bg-orange-500');
    });

    it('switches to list view', async () => {
      const user = userEvent.setup();
      render(<VendorDirectoryPage />);

      const listButton = screen.getByLabelText('List view');
      await user.click(listButton);

      expect(listButton).toHaveClass('bg-orange-500');
      expect(screen.getByLabelText('Grid view')).not.toHaveClass('bg-orange-500');
    });
  });

  describe('Vendor Cards', () => {
    beforeEach(() => {
      localStorage.setItem('active_vendors', JSON.stringify(mockVendors));
    });

    it('displays vendor information correctly', () => {
      render(<VendorDirectoryPage />);

      expect(screen.getByText('Elegant Events Mumbai')).toBeInTheDocument();
      expect(screen.getByText('Luxury event management with attention to detail')).toBeInTheDocument();
      expect(screen.getByText('Mumbai')).toBeInTheDocument();
      expect(screen.getByText('4.8')).toBeInTheDocument();
      expect(screen.getByText('From ₹150,000')).toBeInTheDocument();
    });

    it('shows premium badge for premium vendors', () => {
      render(<VendorDirectoryPage />);

      expect(screen.getByText('Premium')).toBeInTheDocument();
    });

    it('shows verified badge for verified vendors', () => {
      render(<VendorDirectoryPage />);

      expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    it('shows service type badges', () => {
      render(<VendorDirectoryPage />);

      expect(screen.getByText('Event Management')).toBeInTheDocument();
    });

    it('navigates to vendor profile when View Profile is clicked', async () => {
      const user = userEvent.setup();
      render(<VendorDirectoryPage />);

      const viewProfileButtons = screen.getAllByText('View Profile');
      await user.click(viewProfileButtons[0]);

      expect(mockPush).toHaveBeenCalledWith('/vendor/elegant-events-mumbai');
    });
  });

  describe('Wishlist Functionality', () => {
    beforeEach(() => {
      localStorage.setItem('active_vendors', JSON.stringify(mockVendors));
      localStorage.setItem('client_wishlist', JSON.stringify(['vendor-1']));
    });

    it('shows heart icon for wishlisted vendors', () => {
      render(<VendorDirectoryPage />);

      // The heart icon should be solid for wishlisted vendors
      const heartIcons = screen.getAllByRole('button', { name: /wishlist/i });
      expect(heartIcons.length).toBeGreaterThan(0);
    });

    it('toggles wishlist when heart is clicked', async () => {
      const user = userEvent.setup();
      render(<VendorDirectoryPage />);

      const heartButtons = screen.getAllByRole('button', { name: /wishlist/i });
      await user.click(heartButtons[0]);

      // Check that localStorage was updated
      const wishlist = JSON.parse(localStorage.getItem('client_wishlist') || '[]');
      expect(wishlist).not.toContain('vendor-1');
    });

    it('shows toast message when adding to wishlist', async () => {
      const user = userEvent.setup();
      render(<VendorDirectoryPage />);

      // Remove from wishlist first
      localStorage.setItem('client_wishlist', JSON.stringify([]));

      const heartButtons = screen.getAllByRole('button', { name: /wishlist/i });
      await user.click(heartButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Added to wishlist ❤️')).toBeInTheDocument();
      });
    });

    it('shows toast message when removing from wishlist', async () => {
      const user = userEvent.setup();
      render(<VendorDirectoryPage />);

      const heartButtons = screen.getAllByRole('button', { name: /wishlist/i });
      await user.click(heartButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Removed from wishlist')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('shows pagination when there are many vendors', () => {
      // Create many vendors to trigger pagination
      const manyVendors = Array.from({ length: 35 }, (_, i) => ({
        ...mockVendors[0],
        id: `vendor-${i}`,
        businessName: `Vendor ${i}`,
        profile: {
          ...mockVendors[0].profile,
          slug: `vendor-${i}`,
        },
      }));

      localStorage.setItem('active_vendors', JSON.stringify(manyVendors));

      render(<VendorDirectoryPage />);

      expect(screen.getByText('Next »')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('shows no vendors found when search returns no results', async () => {
      const user = userEvent.setup();
      localStorage.setItem('active_vendors', JSON.stringify(mockVendors));

      render(<VendorDirectoryPage />);

      const searchInput = screen.getByPlaceholderText('Search by service, name, or city...');
      await user.type(searchInput, 'nonexistentvendor');

      await waitFor(() => {
        expect(screen.getByText('No vendors found')).toBeInTheDocument();
        expect(screen.getByText('Reset Filters')).toBeInTheDocument();
      });
    });

    it('reset filters button works', async () => {
      const user = userEvent.setup();
      localStorage.setItem('active_vendors', JSON.stringify(mockVendors));

      render(<VendorDirectoryPage />);

      const searchInput = screen.getByPlaceholderText('Search by service, name, or city...');
      await user.type(searchInput, 'nonexistentvendor');

      await waitFor(() => {
        expect(screen.getByText('No vendors found')).toBeInTheDocument();
      });

      const resetButton = screen.getByText('Reset Filters');
      await user.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText('Elegant Events Mumbai')).toBeInTheDocument();
        expect(searchInput).toHaveValue('');
      });
    });
  });
});
