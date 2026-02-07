'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  BuildingOffice2Icon,
  UserIcon,
  BriefcaseIcon,
  CameraIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../contexts/AuthContext';
import { createVendor } from '../../../lib/database';
import { uploadVendorPortfolioImage } from '../../../lib/storage';

interface CompanyInfo {
  companyName: string;
  businessType: string;
  yearsInBusiness: string;
  gstNumber: string;
  website: string;
}

interface ContactInfo {
  contactName: string;
  designation: string;
  mobile: string;
  whatsapp: string;
  email: string;
  password: string;
  confirmPassword: string;
  address: string;
}

interface Services {
  serviceAreas: string[];
  eventTypes: string[];
  otherEventType: string;
  eventCapacity: string;
  teamSize: string;
  description: string;
}

interface Portfolio {
  images: string[]; // base64 strings for preview
  imageFiles: File[]; // actual File objects for upload
  notableEvents: string;
  testimonials: string;
  hasInsurance: boolean;
  monthlyCapacity: string;
  acceptedTerms: boolean;
}

export default function VendorSignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data state
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    companyName: '',
    businessType: '',
    yearsInBusiness: '',
    gstNumber: '',
    website: ''
  });

  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    contactName: '',
    designation: '',
    mobile: '',
    whatsapp: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: ''
  });

  const [services, setServices] = useState<Services>({
    serviceAreas: [],
    eventTypes: [],
    otherEventType: '',
    eventCapacity: '',
    teamSize: '',
    description: ''
  });

  const [portfolio, setPortfolio] = useState<Portfolio>({
    images: [],
    imageFiles: [],
    notableEvents: '',
    testimonials: '',
    hasInsurance: false,
    monthlyCapacity: '',
    acceptedTerms: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation functions
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!companyInfo.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    if (!companyInfo.businessType) {
      newErrors.businessType = 'Please select business type';
    }
    if (!companyInfo.yearsInBusiness || parseInt(companyInfo.yearsInBusiness) < 0) {
      newErrors.yearsInBusiness = 'Years in business is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!contactInfo.contactName.trim()) {
      newErrors.contactName = 'Contact name is required';
    }
    if (!contactInfo.designation.trim()) {
      newErrors.designation = 'Designation is required';
    }
    if (!contactInfo.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^(\+91)?[6-9]\d{9}$/.test(contactInfo.mobile.replace(/\s/g, ''))) {
      newErrors.mobile = 'Please enter a valid Indian mobile number';
    }
    if (!contactInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!contactInfo.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (contactInfo.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (contactInfo.password !== contactInfo.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!contactInfo.address.trim()) {
      newErrors.address = 'Office address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (services.serviceAreas.length === 0) {
      newErrors.serviceAreas = 'Please select at least one service area';
    }
    if (services.eventTypes.length === 0) {
      newErrors.eventTypes = 'Please select at least one event type';
    }
    if (!services.eventCapacity) {
      newErrors.eventCapacity = 'Please select event capacity';
    }
    if (!services.teamSize || parseInt(services.teamSize) < 1) {
      newErrors.teamSize = 'Team size is required';
    }
    if (!services.description.trim()) {
      newErrors.description = 'Company description is required';
    } else if (services.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!portfolio.monthlyCapacity || parseInt(portfolio.monthlyCapacity) < 1) {
      newErrors.monthlyCapacity = 'Monthly capacity is required';
    }
    if (!portfolio.acceptedTerms) {
      newErrors.acceptedTerms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let isValid = false;

    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      default:
        isValid = true;
    }

    if (isValid) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    const newFiles: File[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB for portfolio images

    const remainingSlots = 5 - portfolio.images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      if (file.size > maxSize) {
        alert(`${file.name} is too large. Maximum size is 10MB.`);
        return;
      }

      // Store actual file for upload
      newFiles.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push(reader.result as string);
        if (newImages.length === filesToProcess.length) {
          setPortfolio({
            ...portfolio,
            images: [...portfolio.images, ...newImages],
            imageFiles: [...portfolio.imageFiles, ...newFiles]
          });
        }
      };
      reader.readAsDataURL(file);
    });

    if (filesToProcess.length < files.length) {
      alert('Maximum 5 images allowed');
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = portfolio.images.filter((_, i) => i !== index);
    const updatedFiles = portfolio.imageFiles.filter((_, i) => i !== index);
    setPortfolio({ ...portfolio, images: updatedImages, imageFiles: updatedFiles });
  };

  const handleSubmit = async () => {
    console.log('[Vendor Signup] Starting submission...');

    if (!validateStep4()) {
      console.log('[Vendor Signup] Validation failed');
      return;
    }

    setIsSubmitting(true);
    console.log('[Vendor Signup] Validation passed, submitting set to true');

    try {
      // Step 1: Create Supabase Auth account
      console.log('[Vendor Signup] Step 1: Creating auth account for:', contactInfo.email);
      const authResult = await signup(
        contactInfo.email,
        contactInfo.password,
        'vendor',
        {
          name: contactInfo.contactName,
          phone: contactInfo.mobile,
        }
      );

      console.log('[Vendor Signup] Auth result:', authResult);

      if (!authResult.success) {
        console.error('[Vendor Signup] Auth failed:', authResult.error);
        setErrors({ submit: authResult.error || 'Failed to create account. Please try again.' });
        setIsSubmitting(false);
        return;
      }

      console.log('[Vendor Signup] ✅ Auth account created, userId:', authResult.userId);

      // Get the created user ID from auth
      // The signup function creates the public.users record automatically
      // We need to wait a moment for it to propagate
      console.log('[Vendor Signup] Waiting 1 second for user profile to propagate...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('[Vendor Signup] Wait complete');

      // Step 2: Upload portfolio images to Supabase Storage
      console.log('[Vendor Signup] Step 2: Uploading portfolio images...');
      console.log('[Vendor Signup] Number of image files to upload:', portfolio.imageFiles.length);
      const portfolioUrls: string[] = [];

      // TEMPORARY: Skip image upload to debug signup issue
      console.log('[Vendor Signup] ⚠️ TEMPORARY: Skipping image upload for debugging');

      // TODO: Re-enable after fixing signup
      /*
      for (let i = 0; i < portfolio.imageFiles.length; i++) {
        const file = portfolio.imageFiles[i];
        console.log(`[Vendor Signup] Uploading image ${i + 1}/${portfolio.imageFiles.length}:`, file.name);

        const uploadResult = await uploadVendorPortfolioImage(
          file,
          authResult.userId || contactInfo.email, // Use email as fallback
          'signup'
        );

        console.log(`[Vendor Signup] Upload result for image ${i + 1}:`, uploadResult);

        if (uploadResult.success && uploadResult.url) {
          portfolioUrls.push(uploadResult.url);
          console.log(`[Vendor Signup] ✅ Image ${i + 1} uploaded successfully`);
        } else {
          console.warn(`[Vendor Signup] ⚠️ Failed to upload image ${i + 1}:`, uploadResult.error);
          // Continue with other images even if one fails
        }
      }
      */

      console.log('[Vendor Signup] ✅ All images processed. Uploaded URLs:', portfolioUrls.length);

      // Step 3: Create vendor profile in database
      console.log('[Vendor Signup] Step 3: Creating vendor profile...');

      // Combine all service types
      const allSpecialties = [
        ...services.serviceAreas,
        ...services.eventTypes.filter(t => t !== 'Other'),
        ...(services.otherEventType ? [services.otherEventType] : [])
      ];

      console.log('[Vendor Signup] All specialties:', allSpecialties);

      const vendorData = {
        user_id: authResult.userId || contactInfo.email, // This should be the auth user ID
        company_name: companyInfo.companyName,
        business_type: companyInfo.businessType,
        specialties: allSpecialties,
        location: contactInfo.address,
        city: services.serviceAreas[0] || 'Kerala', // Primary service area
        state: 'Kerala',
        years_experience: parseInt(companyInfo.yearsInBusiness) || 0,
        certifications: {
          gst_number: companyInfo.gstNumber || null,
          website: companyInfo.website || null,
          has_insurance: portfolio.hasInsurance,
        },
        portfolio_urls: portfolioUrls,
        description: services.description,
        rating: 0,
        total_projects: 0,
        verified: false, // Admin approval required
      };

      console.log('[Vendor Signup] Vendor data prepared:', {
        user_id: vendorData.user_id,
        company_name: vendorData.company_name,
        specialties_count: vendorData.specialties.length,
        portfolio_urls_count: vendorData.portfolio_urls.length
      });

      console.log('[Vendor Signup] Calling createVendor API...');
      const vendorResult = await createVendor(vendorData);

      console.log('[Vendor Signup] Vendor creation result:', vendorResult);

      if (vendorResult.error) {
        console.error('[Vendor Signup] ❌ Vendor creation error:', vendorResult.error);
        setErrors({
          submit: 'Account created but profile setup failed. Please contact support at kerala@eventfoundry.com'
        });
        setIsSubmitting(false);
        return;
      }

      console.log('[Vendor Signup] ✅ Vendor profile created successfully:', vendorResult.data);

      // Step 4: Success! Show confirmation
      console.log('[Vendor Signup] Step 4: Showing success confirmation');
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error('Signup error:', error);
      setErrors({
        submit: 'An unexpected error occurred. Please try again or contact support at kerala@eventfoundry.com'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckboxChange = (field: 'serviceAreas' | 'eventTypes', value: string) => {
    const currentValues = services[field];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];

    setServices({ ...services, [field]: newValues });
  };

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full bg-slate-800/90 backdrop-blur-lg rounded-2xl border border-slate-700 p-8 sm:p-12 text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="w-12 h-12 text-green-400" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Registration Received!
          </h1>

          <p className="text-lg text-slate-300 mb-4">
            Thank you for registering with EventFoundry. We'll review your application and get back to you within 24-48 hours.
          </p>

          <p className="text-sm text-slate-400 mb-8">
            You'll receive an email at <span className="text-orange-400 font-medium">{contactInfo.email}</span> with next steps.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/')}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              Return to Homepage
            </button>

            <button
              onClick={() => {
                setSubmitted(false);
                setCurrentStep(1);
                setCompanyInfo({ companyName: '', businessType: '', yearsInBusiness: '', gstNumber: '', website: '' });
                setContactInfo({ contactName: '', designation: '', mobile: '', whatsapp: '', email: '', password: '', confirmPassword: '', address: '' });
                setServices({ serviceAreas: [], eventTypes: [], otherEventType: '', eventCapacity: '', teamSize: '', description: '' });
                setPortfolio({ images: [], imageFiles: [], notableEvents: '', testimonials: '', hasInsurance: false, monthlyCapacity: '', acceptedTerms: false });
                setErrors({});
              }}
              className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all duration-300"
            >
              Submit Another Registration
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Progress indicator data
  const steps = [
    { number: 1, title: 'Company Info', icon: BuildingOffice2Icon },
    { number: 2, title: 'Contact Details', icon: UserIcon },
    { number: 3, title: 'Services & Expertise', icon: BriefcaseIcon },
    { number: 4, title: 'Portfolio & Final', icon: CameraIcon }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 px-4 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Event Company Registration
          </h1>
          <p className="text-slate-300 text-lg">
            Join EventFoundry and connect with clients planning Kerala events nationwide
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;

              return (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        isCompleted
                          ? 'bg-green-500/20 border-green-500 text-green-400'
                          : isActive
                          ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                          : 'bg-slate-800/50 border-slate-700 text-slate-500'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircleIcon className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <div className={`mt-2 text-xs sm:text-sm font-medium hidden sm:block ${
                      isActive ? 'text-orange-400' : isCompleted ? 'text-green-400' : 'text-slate-500'
                    }`}>
                      {step.title}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${
                        isCompleted ? 'bg-green-500' : 'bg-slate-700'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <div className="text-center text-sm text-slate-400">
            Step {currentStep} of 4
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-slate-800/90 backdrop-blur-lg rounded-2xl border border-slate-700 p-6 sm:p-8">
          {/* Step 1: Company Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Company Information</h2>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Company Name <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyInfo.companyName}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, companyName: e.target.value })}
                  placeholder="Kerala Event Productions Pvt Ltd"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                />
                {errors.companyName && (
                  <p className="mt-1 text-sm text-red-400">{errors.companyName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Business Registration Type <span className="text-orange-500">*</span>
                </label>
                <div className="space-y-2">
                  {['Proprietorship', 'Partnership', 'Private Limited', 'LLP'].map((type) => (
                    <label key={type} className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="businessType"
                        value={type}
                        checked={companyInfo.businessType === type}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, businessType: e.target.value })}
                        className="w-4 h-4 text-orange-500 focus:ring-orange-500 focus:ring-offset-slate-900"
                      />
                      <span className="text-slate-300 group-hover:text-white transition-colors">{type}</span>
                    </label>
                  ))}
                </div>
                {errors.businessType && (
                  <p className="mt-1 text-sm text-red-400">{errors.businessType}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Years in Business <span className="text-orange-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={companyInfo.yearsInBusiness}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, yearsInBusiness: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                />
                <p className="mt-1 text-xs text-slate-400">How long have you been in event management?</p>
                {errors.yearsInBusiness && (
                  <p className="mt-1 text-sm text-red-400">{errors.yearsInBusiness}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  GST Number
                </label>
                <input
                  type="text"
                  value={companyInfo.gstNumber}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, gstNumber: e.target.value })}
                  placeholder="22AAAAA0000A1Z5"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                />
                <p className="mt-1 text-xs text-slate-400">Required for invoicing if you win events</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Company Website
                </label>
                <input
                  type="url"
                  value={companyInfo.website}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })}
                  placeholder="https://yourcompany.com"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <button
                onClick={handleNext}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                <span>Next: Contact Details</span>
                <ArrowRightIcon className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 2: Contact Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Contact Information</h2>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Your Name <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  value={contactInfo.contactName}
                  onChange={(e) => setContactInfo({ ...contactInfo, contactName: e.target.value })}
                  placeholder="Rajesh Kumar"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                />
                <p className="mt-1 text-xs text-slate-400">Primary contact person</p>
                {errors.contactName && (
                  <p className="mt-1 text-sm text-red-400">{errors.contactName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Designation <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  value={contactInfo.designation}
                  onChange={(e) => setContactInfo({ ...contactInfo, designation: e.target.value })}
                  placeholder="Founder / Operations Manager"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                />
                {errors.designation && (
                  <p className="mt-1 text-sm text-red-400">{errors.designation}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Mobile Number <span className="text-orange-500">*</span>
                </label>
                <input
                  type="tel"
                  value={contactInfo.mobile}
                  onChange={(e) => {
                    setContactInfo({ ...contactInfo, mobile: e.target.value });
                    if (!contactInfo.whatsapp) {
                      setContactInfo({ ...contactInfo, mobile: e.target.value, whatsapp: e.target.value });
                    }
                  }}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                />
                {errors.mobile && (
                  <p className="mt-1 text-sm text-red-400">{errors.mobile}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={contactInfo.whatsapp}
                  onChange={(e) => setContactInfo({ ...contactInfo, whatsapp: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                />
                <p className="mt-1 text-xs text-slate-400">Clients may contact you via WhatsApp</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address <span className="text-orange-500">*</span>
                </label>
                <input
                  type="email"
                  value={contactInfo.email}
                  onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                  placeholder="contact@yourcompany.com"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password <span className="text-orange-500">*</span>
                </label>
                <input
                  type="password"
                  value={contactInfo.password}
                  onChange={(e) => setContactInfo({ ...contactInfo, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                />
                <p className="mt-1 text-xs text-slate-400">Use a strong password to secure your account</p>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password <span className="text-orange-500">*</span>
                </label>
                <input
                  type="password"
                  value={contactInfo.confirmPassword}
                  onChange={(e) => setContactInfo({ ...contactInfo, confirmPassword: e.target.value })}
                  placeholder="Re-enter your password"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Office Address <span className="text-orange-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={contactInfo.address}
                  onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                  placeholder="Building, Street, Landmark, City, Kerala - PIN"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 resize-none"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-400">{errors.address}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleBack}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all duration-300"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  <span>Back</span>
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all duration-300"
                >
                  <span>Next: Services & Specialization</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Services & Expertise */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Services & Expertise</h2>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Primary Service Areas in Kerala <span className="text-orange-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['Kochi/Ernakulam', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kannur', 'Kollam', 'Palakkad', 'All Kerala'].map((area) => (
                    <label key={area} className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={services.serviceAreas.includes(area)}
                        onChange={() => handleCheckboxChange('serviceAreas', area)}
                        className="w-4 h-4 text-orange-500 focus:ring-orange-500 focus:ring-offset-slate-900 rounded"
                      />
                      <span className="text-slate-300 group-hover:text-white transition-colors text-sm">{area}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-400">Where do you primarily operate?</p>
                {errors.serviceAreas && (
                  <p className="mt-1 text-sm text-red-400">{errors.serviceAreas}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Event Types You Handle <span className="text-orange-500">*</span>
                </label>
                <div className="space-y-2">
                  {['Destination Weddings', 'Traditional Weddings', 'Corporate Events & Conferences', 'Product Launches', 'Cultural Events & Festivals', 'Social Celebrations (Birthdays, Anniversaries)'].map((type) => (
                    <label key={type} className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={services.eventTypes.includes(type)}
                        onChange={() => handleCheckboxChange('eventTypes', type)}
                        className="w-4 h-4 text-orange-500 focus:ring-orange-500 focus:ring-offset-slate-900 rounded"
                      />
                      <span className="text-slate-300 group-hover:text-white transition-colors text-sm">{type}</span>
                    </label>
                  ))}
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={services.eventTypes.includes('Other')}
                      onChange={() => handleCheckboxChange('eventTypes', 'Other')}
                      className="w-4 h-4 text-orange-500 focus:ring-orange-500 focus:ring-offset-slate-900 rounded"
                    />
                    <span className="text-slate-300 group-hover:text-white transition-colors text-sm">Other</span>
                  </label>
                  {services.eventTypes.includes('Other') && (
                    <input
                      type="text"
                      value={services.otherEventType}
                      onChange={(e) => setServices({ ...services, otherEventType: e.target.value })}
                      placeholder="Specify other event type"
                      className="ml-7 w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    />
                  )}
                </div>
                {errors.eventTypes && (
                  <p className="mt-1 text-sm text-red-400">{errors.eventTypes}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Event Capacity <span className="text-orange-500">*</span>
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'small', label: 'Small Events (Up to 100 guests)' },
                    { value: 'medium', label: 'Medium Events (100-300 guests)' },
                    { value: 'large', label: 'Large Events (300-500 guests)' },
                    { value: 'very_large', label: 'Very Large Events (500+ guests)' },
                    { value: 'all_sizes', label: 'All Sizes' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="eventCapacity"
                        value={option.value}
                        checked={services.eventCapacity === option.value}
                        onChange={(e) => setServices({ ...services, eventCapacity: e.target.value })}
                        className="w-4 h-4 text-orange-500 focus:ring-orange-500 focus:ring-offset-slate-900"
                      />
                      <span className="text-slate-300 group-hover:text-white transition-colors text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
                {errors.eventCapacity && (
                  <p className="mt-1 text-sm text-red-400">{errors.eventCapacity}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Team Size <span className="text-orange-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={services.teamSize}
                  onChange={(e) => setServices({ ...services, teamSize: e.target.value })}
                  placeholder="Number of full-time team members"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                />
                <p className="mt-1 text-xs text-slate-400">Helps clients understand your capacity</p>
                {errors.teamSize && (
                  <p className="mt-1 text-sm text-red-400">{errors.teamSize}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Brief Description of Your Company <span className="text-orange-500">*</span>
                </label>
                <textarea
                  rows={5}
                  maxLength={500}
                  value={services.description}
                  onChange={(e) => setServices({ ...services, description: e.target.value })}
                  placeholder="Tell us about your company, your approach to events, what makes you unique..."
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 resize-none"
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-slate-400">Maximum 500 characters</p>
                  <p className="text-xs text-slate-400">{services.description.length}/500</p>
                </div>
                {errors.description && (
                  <p className="mt-1 text-sm text-red-400">{errors.description}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleBack}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all duration-300"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  <span>Back</span>
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all duration-300"
                >
                  <span>Next: Portfolio & Final Details</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Portfolio & Final Details */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Portfolio & Final Details</h2>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Portfolio Images
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="portfolio-upload"
                />
                <label
                  htmlFor="portfolio-upload"
                  className="block w-full px-4 py-8 bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-lg text-center cursor-pointer hover:border-orange-500 hover:bg-slate-900/70 transition-all duration-200"
                >
                  <CameraIcon className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-300 font-medium mb-1">Click to upload images</p>
                  <p className="text-xs text-slate-400">JPG, JPEG, or PNG. Max 5 images, 5MB each.</p>
                </label>
                <p className="mt-2 text-xs text-slate-400">Upload photos of events you've managed. High-quality images preferred.</p>

                {portfolio.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {portfolio.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Portfolio ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <XMarkIcon className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Notable Past Events
                </label>
                <textarea
                  rows={4}
                  value={portfolio.notableEvents}
                  onChange={(e) => setPortfolio({ ...portfolio, notableEvents: e.target.value })}
                  placeholder="List 2-3 significant events you've successfully managed. Include event type, scale, and client if permissible."
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Client Testimonials
                </label>
                <textarea
                  rows={3}
                  value={portfolio.testimonials}
                  onChange={(e) => setPortfolio({ ...portfolio, testimonials: e.target.value })}
                  placeholder="Any client testimonials or references you'd like to share"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 resize-none"
                />
              </div>

              <div>
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={portfolio.hasInsurance}
                    onChange={(e) => setPortfolio({ ...portfolio, hasInsurance: e.target.checked })}
                    className="w-4 h-4 mt-1 text-orange-500 focus:ring-orange-500 focus:ring-offset-slate-900 rounded"
                  />
                  <div>
                    <span className="text-slate-300 group-hover:text-white transition-colors text-sm">
                      We have valid business insurance and comply with local regulations
                    </span>
                    <p className="text-xs text-slate-400 mt-1">Required for high-value events</p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Average Monthly Capacity <span className="text-orange-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={portfolio.monthlyCapacity}
                  onChange={(e) => setPortfolio({ ...portfolio, monthlyCapacity: e.target.value })}
                  placeholder="How many events can you handle per month?"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                />
                <p className="mt-1 text-xs text-slate-400">This helps us match you with appropriate volume</p>
                {errors.monthlyCapacity && (
                  <p className="mt-1 text-sm text-red-400">{errors.monthlyCapacity}</p>
                )}
              </div>

              <div>
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={portfolio.acceptedTerms}
                    onChange={(e) => setPortfolio({ ...portfolio, acceptedTerms: e.target.checked })}
                    className="w-4 h-4 mt-1 text-orange-500 focus:ring-orange-500 focus:ring-offset-slate-900 rounded"
                  />
                  <div>
                    <span className="text-slate-300 group-hover:text-white transition-colors text-sm">
                      I agree to EventFoundry's Terms of Service and Commission Structure (8-12%) <span className="text-orange-500">*</span>
                    </span>
                    <a href="#" className="block text-xs text-orange-400 hover:text-orange-300 mt-1">
                      Read full terms
                    </a>
                  </div>
                </label>
                {errors.acceptedTerms && (
                  <p className="mt-1 text-sm text-red-400">{errors.acceptedTerms}</p>
                )}
              </div>

              {errors.submit && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-sm text-red-300">{errors.submit}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  <span>Back</span>
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Registration</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
