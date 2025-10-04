'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  User, 
  Building2,
  CheckSquare,
  FileText,
  Home,
  ChevronDown,
  LogOut,
  Settings
} from 'lucide-react';
import LaLillyLogoNew from './LaLillyLogoNew';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const clientNavItems: NavItem[] = [
  { name: 'Home', href: '/', icon: Home, description: 'Homepage' },
  { name: 'Plan Event', href: '/plan', icon: FileText, description: 'Start planning' },
  { name: 'My Checklist', href: '/checklist', icon: CheckSquare, description: 'Requirements' },
  { name: 'Event Companies', href: '/vendor-profiles', icon: Building2, description: 'Browse event management companies' },
  { name: 'Find Vendors', href: '/vendor-proposals', icon: Building2, description: 'Browse proposals' }
];

const vendorNavItems: NavItem[] = [
  { name: 'Home', href: '/', icon: Home, description: 'Homepage' },
  { name: 'Dashboard', href: '/vendor-dashboard', icon: Building2, description: 'Vendor portal' },
  { name: 'Join as Partner', href: '/vendor-auth', icon: User, description: 'Event company registration' }
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVendorMode, setIsVendorMode] = useState(false);
  const [vendorSession, setVendorSession] = useState(null);
  const [showVendorMenu, setShowVendorMenu] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is in vendor mode or has vendor session
    const session = localStorage.getItem('lalilly-vendor-session');
    const isVendorPath = pathname.startsWith('/vendor');
    
    setIsVendorMode(isVendorPath);
    setVendorSession(session ? JSON.parse(session) : null);
  }, [pathname]);

  const navItems = isVendorMode || vendorSession ? vendorNavItems : clientNavItems;

  const isActivePath = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleVendorLogout = () => {
    localStorage.removeItem('lalilly-vendor-session');
    setVendorSession(null);
    setShowVendorMenu(false);
    window.location.href = '/';
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded-md"
              aria-label="La-Lilly homepage"
            >
              <LaLillyLogoNew size="sm" variant="gradient" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => {
                const isActive = isActivePath(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-neutral-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    aria-label={item.description}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="w-4 h-4" />
                      {item.name}
                    </div>
                    {isActive && (
                      <motion.div
                        layoutId="navbar-active-bg"
                        className="absolute inset-0 bg-blue-100 rounded-lg -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Desktop Right Section */}
          <div className="hidden md:flex items-center space-x-4">
            {vendorSession ? (
              // Vendor Profile Menu
              <div className="relative">
                <button
                  onClick={() => setShowVendorMenu(!showVendorMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-300 hover:border-blue-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {vendorSession.companyName?.charAt(0) || 'V'}
                  </div>
                  <span className="text-sm font-medium text-neutral-700">
                    {vendorSession.companyName || 'Vendor'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-neutral-500" />
                </button>
                
                <AnimatePresence>
                  {showVendorMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg py-2"
                    >
                      <Link
                        href="/vendor-dashboard"
                        className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-neutral-50 text-sm"
                        onClick={() => setShowVendorMenu(false)}
                      >
                        <Building2 className="w-4 h-4" />
                        Dashboard
                      </Link>
                      <Link
                        href="/vendor-dashboard"
                        className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-neutral-50 text-sm"
                        onClick={() => setShowVendorMenu(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Profile Settings
                      </Link>
                      <hr className="my-2" />
                      <button
                        onClick={handleVendorLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-neutral-50 text-red-600 text-sm"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                {!isVendorMode && (
                  <Link
                    href="/vendor-auth"
                    className="text-neutral-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded-md"
                  >
                    Company Login
                  </Link>
                )}
                <Link
                  href="/plan"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 shadow-sm hover:shadow-md transform hover:scale-105"
                >
                  Start Planning
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              aria-label="Toggle mobile menu"
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-neutral-200 bg-white/95 backdrop-blur-md"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navItems.map((item) => {
                  const isActive = isActivePath(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                        isActive
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-neutral-600 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                      onClick={() => setIsOpen(false)}
                      aria-label={item.description}
                    >
                      <item.icon className="w-5 h-5" />
                      <div>
                        <div>{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-neutral-500 mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}

                {/* Mobile Vendor Session */}
                {vendorSession ? (
                  <div className="border-t border-neutral-200 pt-3 mt-3">
                    <div className="flex items-center gap-3 px-3 py-2 text-sm text-neutral-600">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {vendorSession.companyName?.charAt(0) || 'V'}
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900">
                          {vendorSession.companyName || 'Vendor'}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {vendorSession.ownerName || 'Vendor Account'}
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/vendor-dashboard"
                      className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-neutral-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      <Settings className="w-5 h-5" />
                      Profile Settings
                    </Link>
                    <button
                      onClick={() => {
                        handleVendorLogout();
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-all duration-200 w-full text-left"
                    >
                      <LogOut className="w-5 h-5" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-neutral-200 pt-3 mt-3">
                    {!isVendorMode && (
                      <Link
                        href="/vendor-auth"
                        className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-neutral-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                        onClick={() => setIsOpen(false)}
                      >
                        <User className="w-5 h-5" />
                        Company Login
                      </Link>
                    )}
                    <Link
                      href="/plan"
                      className="flex items-center justify-center gap-2 mx-3 mt-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                      onClick={() => setIsOpen(false)}
                    >
                      <FileText className="w-5 h-5" />
                      Start Planning
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}