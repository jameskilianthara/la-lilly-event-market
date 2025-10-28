'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  Award,
  Users,
  Calendar,
  Mail,
  Building2
} from 'lucide-react';
import LaLillyLogoNew from '../../components/LaLillyLogoNew';

interface EventManagementCompany {
  companyName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  specialties: string[];
  experience: string;
  teamSize: string;
  portfolio: string;
  description: string;
  password: string;
  establishedYear: string;
  certifications: string[];
}

const EVENT_SPECIALTIES = [
  'Wedding Management', 'Corporate Events', 'Destination Weddings', 'Cultural Celebrations',
  'Anniversary Celebrations', 'Birthday Parties', 'Product Launches', 'Conferences & Seminars',
  'Social Gatherings', 'Religious Ceremonies', 'Festival Management', 'Charity Events'
];

const EXPERIENCE_LEVELS = [
  '1-2 years', '3-5 years', '6-10 years', '11-15 years', '15+ years'
];

const TEAM_SIZES = [
  '2-5 members', '6-10 members', '11-20 members', '21-50 members', '50+ members'
];

const CERTIFICATIONS = [
  'Certified Wedding Planner', 'Event Management Professional', 'Corporate Event Specialist',
  'Destination Wedding Coordinator', 'Hospitality Management', 'Cultural Event Coordinator'
];

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
];

export default function VendorAuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [companyProfile, setCompanyProfile] = useState<EventManagementCompany>({
    companyName: '',
    ownerName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    specialties: [],
    experience: '',
    teamSize: '',
    portfolio: '',
    description: '',
    password: '',
    establishedYear: '',
    certifications: []
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!loginData.email) newErrors.email = 'Email is required';
    if (!loginData.password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      setIsLoading(false);
      const existingCompanies = JSON.parse(localStorage.getItem('lalilly-event-companies') || '[]');
      const company = existingCompanies.find((c: { email: string; password: string }) =>
        c.email === loginData.email && c.password === loginData.password
      );

      if (company) {
        localStorage.setItem('lalilly-vendor-session', JSON.stringify(company));
        window.location.href = '/vendor-dashboard';
      } else {
        setErrors({ general: 'Invalid email or password' });
      }
    }, 1500);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const newErrors: Record<string, string> = {};
    
    if (!companyProfile.companyName) newErrors.companyName = 'Company name is required';
    if (!companyProfile.ownerName) newErrors.ownerName = 'Owner name is required';
    if (!companyProfile.email) newErrors.email = 'Email is required';
    if (!companyProfile.phone) newErrors.phone = 'Phone number is required';
    if (!companyProfile.city) newErrors.city = 'City is required';
    if (!companyProfile.state) newErrors.state = 'State is required';
    if (companyProfile.specialties.length === 0) newErrors.specialties = 'At least one specialty is required';
    if (!companyProfile.experience) newErrors.experience = 'Experience is required';
    if (!companyProfile.teamSize) newErrors.teamSize = 'Team size is required';
    if (!companyProfile.description) newErrors.description = 'Company description is required';
    if (!companyProfile.password) newErrors.password = 'Password is required';
    if (!companyProfile.establishedYear) newErrors.establishedYear = 'Established year is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      setIsLoading(false);
      const existingCompanies = JSON.parse(localStorage.getItem('lalilly-event-companies') || '[]');

      if (existingCompanies.some((c: { email: string }) => c.email === companyProfile.email)) {
        setErrors({ email: 'Company with this email already exists' });
        return;
      }

      const newCompany = {
        ...companyProfile,
        id: `company-${Date.now()}`,
        registeredAt: new Date().toISOString(),
        isActive: true
      };

      existingCompanies.push(newCompany);
      localStorage.setItem('lalilly-event-companies', JSON.stringify(existingCompanies));
      localStorage.setItem('lalilly-vendor-session', JSON.stringify(newCompany));
      
      window.location.href = '/vendor-dashboard';
    }, 2000);
  };

  const handleSpecialtyChange = (specialty: string) => {
    const updatedSpecialties = companyProfile.specialties.includes(specialty)
      ? companyProfile.specialties.filter(s => s !== specialty)
      : [...companyProfile.specialties, specialty];
    
    setCompanyProfile(prev => ({ ...prev, specialties: updatedSpecialties }));
  };

  const handleCertificationChange = (certification: string) => {
    const updatedCertifications = companyProfile.certifications.includes(certification)
      ? companyProfile.certifications.filter(c => c !== certification)
      : [...companyProfile.certifications, certification];
    
    setCompanyProfile(prev => ({ ...prev, certifications: updatedCertifications }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-blue-600 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <LaLillyLogoNew size="lg" variant="gradient" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Event Management Company Portal
            </h1>
            <p className="text-neutral-600">
              Join our platform as a comprehensive event management partner
            </p>
          </div>

          {/* Toggle */}
          <div className="flex bg-white rounded-xl p-1 mb-8 shadow-sm">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-6 rounded-lg text-sm font-medium transition-all duration-200 ${
                isLogin
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Company Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-6 rounded-lg text-sm font-medium transition-all duration-200 ${
                !isLogin
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Register Company
            </button>
          </div>

          {/* Forms */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleLogin}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-neutral-900 mb-2">Welcome Back</h2>
                    <p className="text-neutral-600">Sign in to your company account</p>
                  </div>

                  {errors.general && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <span className="text-red-700 text-sm">{errors.general}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Company Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                        className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.email ? 'border-red-300' : 'border-neutral-300'
                        }`}
                        placeholder="your-company@example.com"
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginData.password}
                        onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                        className={`w-full pl-4 pr-11 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.password ? 'border-red-300' : 'border-neutral-300'
                        }`}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 text-white py-3 px-6 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Signing In...' : 'Sign In to Dashboard'}
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleSignup}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-neutral-900 mb-2">Register Your Company</h2>
                    <p className="text-neutral-600">Join as a comprehensive event management partner</p>
                  </div>

                  {/* Company Information */}
                  <div className="bg-blue-50 rounded-xl p-4 mb-6">
                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Company Information
                    </h3>
                    <p className="text-blue-700 text-sm">
                      We partner exclusively with full-service event management companies that can handle complete projects end-to-end.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        value={companyProfile.companyName}
                        onChange={(e) => setCompanyProfile(prev => ({ ...prev, companyName: e.target.value }))}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.companyName ? 'border-red-300' : 'border-neutral-300'
                        }`}
                        placeholder="Your Event Management Company"
                      />
                      {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Owner/CEO Name *
                      </label>
                      <input
                        type="text"
                        value={companyProfile.ownerName}
                        onChange={(e) => setCompanyProfile(prev => ({ ...prev, ownerName: e.target.value }))}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.ownerName ? 'border-red-300' : 'border-neutral-300'
                        }`}
                        placeholder="Your full name"
                      />
                      {errors.ownerName && <p className="text-red-500 text-sm mt-1">{errors.ownerName}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Company Email *
                      </label>
                      <input
                        type="email"
                        value={companyProfile.email}
                        onChange={(e) => setCompanyProfile(prev => ({ ...prev, email: e.target.value }))}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.email ? 'border-red-300' : 'border-neutral-300'
                        }`}
                        placeholder="company@example.com"
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={companyProfile.phone}
                        onChange={(e) => setCompanyProfile(prev => ({ ...prev, phone: e.target.value }))}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.phone ? 'border-red-300' : 'border-neutral-300'
                        }`}
                        placeholder="+91 98765 43210"
                      />
                      {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        value={companyProfile.city}
                        onChange={(e) => setCompanyProfile(prev => ({ ...prev, city: e.target.value }))}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.city ? 'border-red-300' : 'border-neutral-300'
                        }`}
                        placeholder="Mumbai"
                      />
                      {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        State *
                      </label>
                      <select
                        value={companyProfile.state}
                        onChange={(e) => setCompanyProfile(prev => ({ ...prev, state: e.target.value }))}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.state ? 'border-red-300' : 'border-neutral-300'
                        }`}
                      >
                        <option value="">Select State</option>
                        {STATES.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Established Year *
                      </label>
                      <input
                        type="number"
                        min="1990"
                        max="2024"
                        value={companyProfile.establishedYear}
                        onChange={(e) => setCompanyProfile(prev => ({ ...prev, establishedYear: e.target.value }))}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.establishedYear ? 'border-red-300' : 'border-neutral-300'
                        }`}
                        placeholder="2020"
                      />
                      {errors.establishedYear && <p className="text-red-500 text-sm mt-1">{errors.establishedYear}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        <Award className="w-4 h-4 inline mr-1" />
                        Experience *
                      </label>
                      <select
                        value={companyProfile.experience}
                        onChange={(e) => setCompanyProfile(prev => ({ ...prev, experience: e.target.value }))}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.experience ? 'border-red-300' : 'border-neutral-300'
                        }`}
                      >
                        <option value="">Select Experience</option>
                        {EXPERIENCE_LEVELS.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                      {errors.experience && <p className="text-red-500 text-sm mt-1">{errors.experience}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        <Users className="w-4 h-4 inline mr-1" />
                        Team Size *
                      </label>
                      <select
                        value={companyProfile.teamSize}
                        onChange={(e) => setCompanyProfile(prev => ({ ...prev, teamSize: e.target.value }))}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.teamSize ? 'border-red-300' : 'border-neutral-300'
                        }`}
                      >
                        <option value="">Select Team Size</option>
                        {TEAM_SIZES.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                      {errors.teamSize && <p className="text-red-500 text-sm mt-1">{errors.teamSize}</p>}
                    </div>
                  </div>

                  {/* Event Specialties */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">
                      Event Management Specialties * (Select all that apply)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {EVENT_SPECIALTIES.map(specialty => (
                        <label key={specialty} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={companyProfile.specialties.includes(specialty)}
                            onChange={() => handleSpecialtyChange(specialty)}
                            className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-neutral-700">{specialty}</span>
                        </label>
                      ))}
                    </div>
                    {errors.specialties && <p className="text-red-500 text-sm mt-1">{errors.specialties}</p>}
                  </div>

                  {/* Certifications */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">
                      Professional Certifications (Optional)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {CERTIFICATIONS.map(certification => (
                        <label key={certification} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={companyProfile.certifications.includes(certification)}
                            onChange={() => handleCertificationChange(certification)}
                            className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-neutral-700">{certification}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Portfolio Website (Optional)
                    </label>
                    <input
                      type="url"
                      value={companyProfile.portfolio}
                      onChange={(e) => setCompanyProfile(prev => ({ ...prev, portfolio: e.target.value }))}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="https://your-company-portfolio.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Company Description *
                    </label>
                    <textarea
                      value={companyProfile.description}
                      onChange={(e) => setCompanyProfile(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                        errors.description ? 'border-red-300' : 'border-neutral-300'
                      }`}
                      placeholder="Describe your company's approach to comprehensive event management, your team's expertise, and what makes your services unique..."
                    />
                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={companyProfile.password}
                        onChange={(e) => setCompanyProfile(prev => ({ ...prev, password: e.target.value }))}
                        className={`w-full pl-4 pr-11 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.password ? 'border-red-300' : 'border-neutral-300'
                        }`}
                        placeholder="Create a secure password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800 mb-1">Partnership Requirements</p>
                        <ul className="text-amber-700 text-sm space-y-1">
                          <li>• Must be a comprehensive event management company</li>
                          <li>• Capable of handling complete projects end-to-end</li>
                          <li>• Have established vendor networks and partnerships</li>
                          <li>• Provide seamless client experience from planning to execution</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 text-white py-4 px-6 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Registering Company...' : 'Register Event Management Company'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}