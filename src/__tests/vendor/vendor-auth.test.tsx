import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import VendorAuthPage from '../../app/vendor-auth/page';

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

describe('Vendor Authentication', () => {
  beforeEach(() => {
    localStorage.clear();
    mockLocation.href = '';
  });

  describe('Login Form', () => {
    it('renders login form by default', () => {
      render(<VendorAuthPage />);
      expect(screen.getByText('Company Login')).toBeInTheDocument();
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByLabelText(/Company Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    });

    it('validates required fields on login', async () => {
      const user = userEvent.setup();
      render(<VendorAuthPage />);

      const submitButton = screen.getByText('Sign In to Dashboard');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    it('shows error for invalid credentials', async () => {
      const user = userEvent.setup();
      render(<VendorAuthPage />);

      const emailInput = screen.getByLabelText(/Company Email/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const submitButton = screen.getByText('Sign In to Dashboard');

      await user.type(emailInput, 'invalid@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
      });
    });

    it('successfully logs in with valid credentials', async () => {
      const user = userEvent.setup();

      // Setup mock vendor data
      const mockVendor = {
        id: 'company-123',
        companyName: 'Test Company',
        ownerName: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
        phone: '+91 9876543210',
        city: 'Mumbai',
        state: 'Maharashtra',
        specialties: ['Wedding Management'],
        experience: '5-10 years',
        teamSize: '11-20 members',
        description: 'Test description',
        registeredAt: new Date().toISOString(),
        isActive: true,
      };

      localStorage.setItem('lalilly-event-companies', JSON.stringify([mockVendor]));

      render(<VendorAuthPage />);

      const emailInput = screen.getByLabelText(/Company Email/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const submitButton = screen.getByText('Sign In to Dashboard');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLocation.href).toBe('/vendor-dashboard');
        expect(localStorage.getItem('lalilly-vendor-session')).toBe(JSON.stringify(mockVendor));
      });
    });

    it('toggles password visibility', async () => {
      const user = userEvent.setup();
      render(<VendorAuthPage />);

      const passwordInput = screen.getByLabelText(/Password/i);
      const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button

      expect(passwordInput).toHaveAttribute('type', 'password');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Signup Form', () => {
    it('switches to signup form when register button is clicked', async () => {
      const user = userEvent.setup();
      render(<VendorAuthPage />);

      const registerButton = screen.getByText('Register Company');
      await user.click(registerButton);

      expect(screen.getByText('Register Your Company')).toBeInTheDocument();
      expect(screen.getByLabelText(/Company Name \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Owner\/CEO Name \*/i)).toBeInTheDocument();
    });

    it('validates required fields on signup', async () => {
      const user = userEvent.setup();
      render(<VendorAuthPage />);

      const registerButton = screen.getByText('Register Company');
      await user.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText('Register Your Company')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Register Event Management Company');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Company name is required')).toBeInTheDocument();
        expect(screen.getByText('Owner name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Phone number is required')).toBeInTheDocument();
        expect(screen.getByText('City is required')).toBeInTheDocument();
        expect(screen.getByText('State is required')).toBeInTheDocument();
        expect(screen.getByText('At least one specialty is required')).toBeInTheDocument();
        expect(screen.getByText('Experience is required')).toBeInTheDocument();
        expect(screen.getByText('Team size is required')).toBeInTheDocument();
        expect(screen.getByText('Company description is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
        expect(screen.getByText('Established year is required')).toBeInTheDocument();
      });
    });

    it('successfully registers a new vendor', async () => {
      const user = userEvent.setup();
      render(<VendorAuthPage />);

      const registerButton = screen.getByText('Register Company');
      await user.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText('Register Your Company')).toBeInTheDocument();
      });

      // Fill out all required fields
      await user.type(screen.getByPlaceholderText('Your Event Management Company'), 'New Test Company');
      await user.type(screen.getByPlaceholderText('Your full name'), 'Jane Smith');
      await user.type(screen.getByPlaceholderText('company@example.com'), 'newcompany@example.com');
      await user.type(screen.getByPlaceholderText('+91 98765 43210'), '+91 9876543210');
      await user.type(screen.getByPlaceholderText('Mumbai'), 'Bangalore');
      await user.selectOptions(screen.getByLabelText('State *'), 'Karnataka');
      await user.click(screen.getByLabelText('Wedding Management'));
      await user.selectOptions(screen.getByLabelText(/Experience \*/i), '3-5 years');
      await user.selectOptions(screen.getByLabelText(/Team Size \*/i), '6-10 members');
      await user.type(screen.getByLabelText(/Company Description \*/i), 'Test company description');
      await user.type(screen.getByLabelText(/Password \*/i), 'password123');
      await user.type(screen.getByLabelText(/Established Year \*/i), '2020');

      const submitButton = screen.getByText('Register Event Management Company');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLocation.href).toBe('/vendor-dashboard');
        const storedCompanies = JSON.parse(localStorage.getItem('lalilly-event-companies') || '[]');
        expect(storedCompanies).toHaveLength(1);
        expect(storedCompanies[0].companyName).toBe('New Test Company');
      });
    });

    it('prevents duplicate email registration', async () => {
      const user = userEvent.setup();

      // Setup existing company
      const existingCompany = {
        email: 'existing@example.com',
        companyName: 'Existing Company',
      };
      localStorage.setItem('lalilly-event-companies', JSON.stringify([existingCompany]));

      render(<VendorAuthPage />);

      const registerButton = screen.getByText('Register Company');
      await user.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText('Register Your Company')).toBeInTheDocument();
      });

      // Fill out form with existing email
      await user.type(screen.getByPlaceholderText('Your Event Management Company'), 'New Company');
      await user.type(screen.getByPlaceholderText('Your full name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('company@example.com'), 'existing@example.com');
      await user.type(screen.getByPlaceholderText('+91 98765 43210'), '+91 9876543210');
      await user.type(screen.getByPlaceholderText('Mumbai'), 'Mumbai');
      await user.selectOptions(screen.getByLabelText('State *'), 'Maharashtra');
      await user.click(screen.getByLabelText('Wedding Management'));
      await user.selectOptions(screen.getByLabelText(/Experience \*/i), '3-5 years');
      await user.selectOptions(screen.getByLabelText(/Team Size \*/i), '6-10 members');
      await user.type(screen.getByLabelText(/Company Description \*/i), 'Description');
      await user.type(screen.getByLabelText(/Password \*/i), 'password123');
      await user.type(screen.getByLabelText(/Established Year \*/i), '2020');

      const submitButton = screen.getByText('Register Event Management Company');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Company with this email already exists')).toBeInTheDocument();
      });
    });

    it('handles specialty selection', async () => {
      const user = userEvent.setup();
      render(<VendorAuthPage />);

      const registerButton = screen.getByText('Register Company');
      await user.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText('Register Your Company')).toBeInTheDocument();
      });

      const weddingCheckbox = screen.getByLabelText('Wedding Management');
      const corporateCheckbox = screen.getByLabelText('Corporate Events');

      expect(weddingCheckbox).not.toBeChecked();
      expect(corporateCheckbox).not.toBeChecked();

      await user.click(weddingCheckbox);
      expect(weddingCheckbox).toBeChecked();

      await user.click(corporateCheckbox);
      expect(corporateCheckbox).toBeChecked();

      await user.click(weddingCheckbox);
      expect(weddingCheckbox).not.toBeChecked();
      expect(corporateCheckbox).toBeChecked();
    });

    it('handles certification selection', async () => {
      const user = userEvent.setup();
      render(<VendorAuthPage />);

      const registerButton = screen.getByText('Register Company');
      await user.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText('Register Your Company')).toBeInTheDocument();
      });

      const cert1 = screen.getByLabelText('Certified Wedding Planner');
      const cert2 = screen.getByLabelText('Event Management Professional');

      expect(cert1).not.toBeChecked();
      expect(cert2).not.toBeChecked();

      await user.click(cert1);
      expect(cert1).toBeChecked();

      await user.click(cert2);
      expect(cert2).toBeChecked();
    });
  });

  describe('Navigation', () => {
    it('has back to home link', () => {
      render(<VendorAuthPage />);
      const backLink = screen.getByText('Back to Home');
      expect(backLink).toBeInTheDocument();
      expect(backLink.closest('a')).toHaveAttribute('href', '/');
    });
  });
});
