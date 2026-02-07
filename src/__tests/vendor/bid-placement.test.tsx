import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import SmartBidForm from '../../app/craftsmen/events/[eventId]/bid/page';

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
const mockParams = { eventId: 'event-123' };

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => mockParams,
}));

const mockVendorSession = {
  vendorId: 'vendor-123',
  email: 'vendor@test.com',
  businessName: 'Test Vendor Company',
  phone: '+91 9876543210',
};

const mockEvent = {
  eventId: 'event-123',
  eventMemory: {
    event_type: 'Wedding',
    date: '2024-12-25',
    location: 'Mumbai, Maharashtra',
    guest_count: '200',
    venue_status: 'Venue booked by client',
  },
  checklistData: {
    selections: {
      'Catering': ['Main course buffet', 'Welcome drinks'],
      'Decoration': ['Wedding car decoration', 'Grand entrance setup'],
      'Photography': ['Professional videography', 'Candid photography'],
    },
  },
  bids: [],
  status: 'active',
};

describe('Bid Placement Form', () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockClear();
    localStorage.setItem('vendor_session', JSON.stringify(mockVendorSession));
    localStorage.setItem('posted_events', JSON.stringify([mockEvent]));
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Authentication and Loading', () => {
    it('redirects to login when no vendor session exists', () => {
      localStorage.removeItem('vendor_session');
      render(<SmartBidForm />);

      expect(mockPush).toHaveBeenCalledWith('/craftsmen/login?returnUrl=/craftsmen/events/event-123/bid');
    });

    it('shows loading state initially', () => {
      render(<SmartBidForm />);
      expect(screen.getByText('Loading event details...')).toBeInTheDocument();
    });

    it('loads event and initializes form', async () => {
      render(<SmartBidForm />);

      await waitFor(() => {
        expect(screen.getByText('Wedding')).toBeInTheDocument();
        expect(screen.getByText('Mumbai, Maharashtra')).toBeInTheDocument();
        expect(screen.getByText('Smart Pricing Calculator')).toBeInTheDocument();
      });
    });
  });

  describe('Event Context Display', () => {
    it('displays event information in header', async () => {
      render(<SmartBidForm />);

      await waitFor(() => {
        expect(screen.getByText('Wedding')).toBeInTheDocument();
        expect(screen.getByText('Dec 25')).toBeInTheDocument(); // Formatted date
        expect(screen.getByText('200 guests')).toBeInTheDocument();
        expect(screen.getByText('Mumbai, Maharashtra')).toBeInTheDocument();
        expect(screen.getByText('Venue booked by client')).toBeInTheDocument();
      });
    });

    it('shows time until event', async () => {
      render(<SmartBidForm />);

      await waitFor(() => {
        // Should show days until event
        const timeElement = screen.getByText(/\d+ days away|Today|\d+ weeks away/);
        expect(timeElement).toBeInTheDocument();
      });
    });

    it('displays competition information', async () => {
      render(<SmartBidForm />);

      await waitFor(() => {
        expect(screen.getByText('0 bids')).toBeInTheDocument();
      });
    });
  });

  describe('Smart Pricing Calculator', () => {
    it('displays all requirement categories', async () => {
      render(<SmartBidForm />);

      await waitFor(() => {
        expect(screen.getByText('Catering')).toBeInTheDocument();
        expect(screen.getByText('Decoration')).toBeInTheDocument();
        expect(screen.getByText('Photography')).toBeInTheDocument();
      });
    });

    it('shows client requirements for each category', async () => {
      render(<SmartBidForm />);

      await waitFor(() => {
        expect(screen.getByText('Main course buffet')).toBeInTheDocument();
        expect(screen.getByText('Wedding car decoration')).toBeInTheDocument();
        expect(screen.getByText('Professional videography')).toBeInTheDocument();
      });
    });

    it('shows market rate guidance', async () => {
      render(<SmartBidForm />);

      await waitFor(() => {
        expect(screen.getByText('Market Guidance')).toBeInTheDocument();
        expect(screen.getByText(/Market rate:/)).toBeInTheDocument();
      });
    });

    it('allows adding line items to categories', async () => {
      const user = userEvent.setup();
      render(<SmartBidForm />);

      await waitFor(() => {
        const addButtons = screen.getAllByText('Add Line Item');
        expect(addButtons.length).toBe(3); // One for each category
      });

      const firstAddButton = screen.getAllByText('Add Line Item')[0];
      await user.click(firstAddButton);

      // Should now have 2 line items for first category
      const descriptionInputs = screen.getAllByPlaceholderText('e.g., Main course buffet');
      expect(descriptionInputs.length).toBe(4); // 3 categories × 1 default + 1 added = 4
    });

    it('allows removing line items', async () => {
      const user = userEvent.setup();
      render(<SmartBidForm />);

      await waitFor(() => {
        const removeButtons = screen.getAllByRole('button', { name: /remove/i });
        expect(removeButtons.length).toBe(3); // Initially disabled for single items
      });

      // Add an item first
      const addButton = screen.getAllByText('Add Line Item')[0];
      await user.click(addButton);

      await waitFor(() => {
        const removeButtons = screen.getAllByTitle('Remove item');
        expect(removeButtons.length).toBeGreaterThan(3);
      });

      const removeButton = screen.getAllByTitle('Remove item')[0];
      await user.click(removeButton);

      // Should have fewer inputs now
      const descriptionInputs = screen.getAllByPlaceholderText('e.g., Main course buffet');
      expect(descriptionInputs.length).toBe(3); // Back to 3
    });

    it('calculates line item totals automatically', async () => {
      const user = userEvent.setup();
      render(<SmartBidForm />);

      await waitFor(() => {
        const quantityInput = screen.getAllByDisplayValue('1')[0];
        const unitPriceInput = screen.getAllByDisplayValue('')[0];

        // Enter quantity and price
        fireEvent.change(quantityInput, { target: { value: '10' } });
        fireEvent.change(unitPriceInput, { target: { value: '500' } });
      });

      await waitFor(() => {
        expect(screen.getByText('10 × ₹500')).toBeInTheDocument();
        expect(screen.getByText('= ₹5,000')).toBeInTheDocument();
      });
    });

    it('calculates category subtotals', async () => {
      const user = userEvent.setup();
      render(<SmartBidForm />);

      await waitFor(() => {
        const inputs = screen.getAllByDisplayValue('');
        const quantityInput = inputs.find(input => input.getAttribute('type') === 'number') as HTMLInputElement;
        const priceInput = inputs.find(input => input.getAttribute('type') === 'number' && input !== quantityInput) as HTMLInputElement;

        if (quantityInput && priceInput) {
          fireEvent.change(quantityInput, { target: { value: '5' } });
          fireEvent.change(priceInput, { target: { value: '1000' } });
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Category Subtotal:')).toBeInTheDocument();
        expect(screen.getByText('₹5,000')).toBeInTheDocument();
      });
    });
  });

  describe('Proposal Details', () => {
    it('has required fields for cover letter and why perfect', async () => {
      render(<SmartBidForm />);

      await waitFor(() => {
        expect(screen.getByText('Cover Letter *')).toBeInTheDocument();
        expect(screen.getByText('Why You\'re Perfect *')).toBeInTheDocument();
        expect(screen.getByText('Timeline *')).toBeInTheDocument();
      });
    });

    it('validates cover letter minimum length', async () => {
      const user = userEvent.setup();
      render(<SmartBidForm />);

      await waitFor(() => {
        const coverLetterTextarea = screen.getByPlaceholderText('Introduce yourself and your approach to this event...');
        fireEvent.change(coverLetterTextarea, { target: { value: 'Too short' } });
      });

      const submitButton = screen.getByText('Submit Proposal');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Cover letter must be at least 50 characters')).toBeInTheDocument();
      });
    });

    it('validates why perfect minimum length', async () => {
      const user = userEvent.setup();
      render(<SmartBidForm />);

      await waitFor(() => {
        const whyPerfectTextarea = screen.getByPlaceholderText('What makes you stand out for this event?');
        fireEvent.change(whyPerfectTextarea, { target: { value: 'Short' } });
      });

      const submitButton = screen.getByText('Submit Proposal');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please provide at least 20 characters')).toBeInTheDocument();
      });
    });

    it('validates advance payment percentage', async () => {
      const user = userEvent.setup();
      render(<SmartBidForm />);

      await waitFor(() => {
        const advanceInput = screen.getByDisplayValue('30');
        fireEvent.change(advanceInput, { target: { value: '60' } });
      });

      const submitButton = screen.getByText('Submit Proposal');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Advance must be between 0% and 50%')).toBeInTheDocument();
      });
    });
  });

  describe('Portfolio Management', () => {
    it('allows adding portfolio images', async () => {
      const user = userEvent.setup();
      render(<SmartBidForm />);

      await waitFor(() => {
        const addImageButton = screen.getByText('+ Add Image');
        expect(addImageButton).toBeInTheDocument();

        // Should start with one empty field
        const urlInputs = screen.getAllByPlaceholderText('https://example.com/image.jpg');
        expect(urlInputs.length).toBe(1);
      });

      const addImageButton = screen.getByText('+ Add Image');
      await user.click(addImageButton);

      await waitFor(() => {
        const urlInputs = screen.getAllByPlaceholderText('https://example.com/image.jpg');
        expect(urlInputs.length).toBe(2);
      });
    });

    it('allows removing portfolio images', async () => {
      const user = userEvent.setup();
      render(<SmartBidForm />);

      await waitFor(() => {
        const addImageButton = screen.getByText('+ Add Image');
        await user.click(addImageButton);
      });

      await waitFor(() => {
        const removeButtons = screen.getAllByText('×');
        expect(removeButtons.length).toBe(1); // Now can remove the second field
      });

      const removeButton = screen.getAllByText('×')[0];
      await user.click(removeButton);

      await waitFor(() => {
        const urlInputs = screen.getAllByPlaceholderText('https://example.com/image.jpg');
        expect(urlInputs.length).toBe(1);
      });
    });
  });

  describe('Proposal Summary Sidebar', () => {
    it('shows running total calculation', async () => {
      render(<SmartBidForm />);

      await waitFor(() => {
        expect(screen.getByText('Proposal Summary')).toBeInTheDocument();
        expect(screen.getByText('Subtotal')).toBeInTheDocument();
        expect(screen.getByText('GST (18%)')).toBeInTheDocument();
        expect(screen.getByText('Total')).toBeInTheDocument();
      });
    });

    it('calculates advance amount', async () => {
      const user = userEvent.setup();
      render(<SmartBidForm />);

      await waitFor(() => {
        // Add some pricing first
        const quantityInput = screen.getAllByDisplayValue('1')[0];
        const priceInput = screen.getAllByDisplayValue('')[0];

        fireEvent.change(quantityInput, { target: { value: '100' } });
        fireEvent.change(priceInput, { target: { value: '1000' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Advance (30%)')).toBeInTheDocument();
        expect(screen.getByText('₹30,000')).toBeInTheDocument(); // 30% of ₹100,000
      });
    });

    it('shows pro tips', async () => {
      render(<SmartBidForm />);

      await waitFor(() => {
        expect(screen.getByText('Pro Tips')).toBeInTheDocument();
        expect(screen.getByText('Break down pricing by line items for clarity')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('prevents submission with incomplete pricing', async () => {
      const user = userEvent.setup();
      render(<SmartBidForm />);

      await waitFor(() => {
        const submitButton = screen.getByText('Submit Proposal');
        expect(submitButton).toBeDisabled();
      });
    });

    it('prevents submission with invalid form data', async () => {
      const user = userEvent.setup();
      render(<SmartBidForm />);

      await waitFor(() => {
        // Fill minimum pricing
        const quantityInputs = screen.getAllByDisplayValue('1');
        const priceInputs = screen.getAllByDisplayValue('');

        // Add pricing to at least 2 categories (minimum required)
        fireEvent.change(quantityInputs[0], { target: { value: '10' } });
        fireEvent.change(priceInputs[0], { target: { value: '1000' } });

        fireEvent.change(quantityInputs[3], { target: { value: '5' } });
        fireEvent.change(priceInputs[3], { target: { value: '2000' } });

        // Fill required text fields minimally
        const coverLetter = screen.getByPlaceholderText('Introduce yourself and your approach to this event...');
        const whyPerfect = screen.getByPlaceholderText('What makes you stand out for this event?');
        const timeline = screen.getByDisplayValue('');

        fireEvent.change(coverLetter, { target: { value: 'A'.repeat(50) } });
        fireEvent.change(whyPerfect, { target: { value: 'A'.repeat(20) } });
        fireEvent.change(timeline, { target: { value: '2024-12-20' } });
      });

      const submitButton = screen.getByText('Submit Proposal');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/craftsmen/dashboard');
      });
    });

    it('shows validation errors for incomplete form', async () => {
      const user = userEvent.setup();
      render(<SmartBidForm />);

      await waitFor(() => {
        const submitButton = screen.getByText('Submit Proposal');
        await user.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Please provide pricing for at least 2 categories')).toBeInTheDocument();
        expect(screen.getByText('Cover letter must be at least 50 characters')).toBeInTheDocument();
        expect(screen.getByText('Please provide at least 20 characters')).toBeInTheDocument();
        expect(screen.getByText('Please provide a timeline')).toBeInTheDocument();
      });
    });

    it('saves bid to localStorage on successful submission', async () => {
      const user = userEvent.setup();
      render(<SmartBidForm />);

      await waitFor(() => {
        // Fill minimum required data
        const quantityInputs = screen.getAllByDisplayValue('1');
        const priceInputs = screen.getAllByDisplayValue('');

        fireEvent.change(quantityInputs[0], { target: { value: '10' } });
        fireEvent.change(priceInputs[0], { target: { value: '1000' } });

        fireEvent.change(quantityInputs[3], { target: { value: '5' } });
        fireEvent.change(priceInputs[3], { target: { value: '2000' } });

        const coverLetter = screen.getByPlaceholderText('Introduce yourself and your approach to this event...');
        const whyPerfect = screen.getByPlaceholderText('What makes you stand out for this event?');
        const timeline = screen.getByDisplayValue('');

        fireEvent.change(coverLetter, { target: { value: 'A'.repeat(50) } });
        fireEvent.change(whyPerfect, { target: { value: 'A'.repeat(20) } });
        fireEvent.change(timeline, { target: { value: '2024-12-20' } });
      });

      const submitButton = screen.getByText('Submit Proposal');
      await user.click(submitButton);

      await waitFor(() => {
        const vendorBids = JSON.parse(localStorage.getItem('vendor_bids') || '[]');
        expect(vendorBids.length).toBe(1);
        expect(vendorBids[0].eventId).toBe('event-123');
        expect(vendorBids[0].vendorId).toBe('vendor-123');
      });
    });

    it('shows success message after submission', async () => {
      const user = userEvent.setup();
      render(<SmartBidForm />);

      await waitFor(() => {
        // Fill minimum required data
        const quantityInputs = screen.getAllByDisplayValue('1');
        const priceInputs = screen.getAllByDisplayValue('');

        fireEvent.change(quantityInputs[0], { target: { value: '10' } });
        fireEvent.change(priceInputs[0], { target: { value: '1000' } });

        fireEvent.change(quantityInputs[3], { target: { value: '5' } });
        fireEvent.change(priceInputs[3], { target: { value: '2000' } });

        const coverLetter = screen.getByPlaceholderText('Introduce yourself and your approach to this event...');
        const whyPerfect = screen.getByPlaceholderText('What makes you stand out for this event?');
        const timeline = screen.getByDisplayValue('');

        fireEvent.change(coverLetter, { target: { value: 'A'.repeat(50) } });
        fireEvent.change(whyPerfect, { target: { value: 'A'.repeat(20) } });
        fireEvent.change(timeline, { target: { value: '2024-12-20' } });
      });

      const submitButton = screen.getByText('Submit Proposal');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Proposal submitted! 🎉')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode', () => {
    it('loads existing bid data when editing', () => {
      const existingBid = {
        bidId: 'bid-123',
        vendorId: 'vendor-123',
        vendorName: 'Test Vendor',
        vendorEmail: 'vendor@test.com',
        pricing: {
          'Catering': { amount: 50000, notes: 'Complete catering package' },
        },
        subtotals: { 'Catering': 50000 },
        total: 50000,
        coverLetter: 'Existing cover letter content',
        whyPerfect: 'Why we are perfect',
        timeline: '2024-12-20',
        advancePayment: 25,
        portfolio: ['https://example.com/image1.jpg'],
        submittedAt: new Date().toISOString(),
        status: 'pending',
      };

      const eventWithBid = {
        ...mockEvent,
        bids: [existingBid],
      };

      localStorage.setItem('posted_events', JSON.stringify([eventWithBid]));

      render(<SmartBidForm />);

      // Should show edit mode banner
      expect(screen.getByText('Editing your submitted proposal')).toBeInTheDocument();
    });
  });
});
