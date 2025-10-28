'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bars3Icon, XMarkIcon, ChevronDownIcon, ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (loginDropdownOpen) setLoginDropdownOpen(false);
      if (userMenuOpen) setUserMenuOpen(false);
    };
    if (loginDropdownOpen || userMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [loginDropdownOpen, userMenuOpen]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const isActivePath = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  // Smart navigation links based on user type
  const getNavLinks = () => {
    const baseLinks = [
      { name: 'Plan My Event', href: '/forge' },
      { name: 'Browse Vendors', href: '/vendors' },
      // Show dashboard for logged-in vendors, onboarding for others
      isAuthenticated && user?.userType === 'vendor'
        ? { name: 'Vendor Dashboard', href: '/craftsmen/dashboard' }
        : { name: 'For Vendors', href: '/craftsmen' },
      { name: 'How It Works', href: '/how-it-works' }
    ];
    return baseLinks;
  };

  const navLinks = getNavLinks();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-[72px] bg-slate-900/95 backdrop-blur-lg border-b border-slate-800 shadow-lg shadow-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <svg className="w-8 h-8 text-orange-500 animate-spin [animation-duration:3s]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="text-2xl font-bold">
                <span className="text-white">Event</span>
                <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent group-hover:from-orange-400 group-hover:to-orange-500 transition-all duration-300">
                  Foundry
                </span>
              </div>
            </Link>

            {/* Desktop Navigation - Center */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => {
                const isActive = isActivePath(link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`relative text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'text-orange-500'
                        : 'text-slate-300 hover:text-orange-500'
                    }`}
                  >
                    {link.name}
                    {isActive && (
                      <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Desktop Navigation - Right */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  {/* User Menu Dropdown */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setUserMenuOpen(!userMenuOpen);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200"
                    >
                      <UserCircleIcon className="w-5 h-5" />
                      <span>{user?.userType === 'vendor' ? user.companyName : user?.name || user?.email}</span>
                      <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-slate-800/95 backdrop-blur-lg border border-slate-700 rounded-lg shadow-xl shadow-black/20 overflow-hidden">
                        <Link
                          href={user?.userType === 'vendor' ? '/craftsmen/dashboard' : '/dashboard/client'}
                          className="block px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors duration-200"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <div className="font-medium">Dashboard</div>
                          <div className="text-xs text-slate-400 mt-0.5">View your {user?.userType === 'vendor' ? 'projects' : 'events'}</div>
                        </Link>
                        <div className="border-t border-slate-700/50" />
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors duration-200 flex items-center space-x-2"
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4" />
                          <span className="font-medium">Logout</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Plan Event CTA (show for both vendor and client) */}
                  {user?.userType === 'client' && (
                    <Link
                      href="/forge"
                      className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-semibold rounded-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all duration-300 transform hover:scale-105"
                    >
                      Plan an Event
                    </Link>
                  )}
                </>
              ) : (
                <>
                  {/* Login Dropdown */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLoginDropdownOpen(!loginDropdownOpen);
                      }}
                      className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200"
                    >
                      <span>Login</span>
                      <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${loginDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {loginDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-slate-800/95 backdrop-blur-lg border border-slate-700 rounded-lg shadow-xl shadow-black/20 overflow-hidden">
                        <Link
                          href="/login"
                          className="block px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors duration-200"
                          onClick={() => setLoginDropdownOpen(false)}
                        >
                          <div className="font-medium">Client Login</div>
                          <div className="text-xs text-slate-400 mt-0.5">Planning an event</div>
                        </Link>
                        <div className="border-t border-slate-700/50" />
                        <Link
                          href="/craftsmen/login"
                          className="block px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors duration-200"
                          onClick={() => setLoginDropdownOpen(false)}
                        >
                          <div className="font-medium">Event Manager Login</div>
                          <div className="text-xs text-slate-400 mt-0.5">Vendor portal</div>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Plan Event CTA */}
                  <Link
                    href="/forge"
                    className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-semibold rounded-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all duration-300 transform hover:scale-105"
                  >
                    Plan an Event
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-300 hover:text-white transition-colors duration-200"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 top-[72px] bg-slate-900 md:hidden z-50">
            <div className="flex flex-col h-[calc(100vh-72px)] overflow-hidden">
              {/* Mobile Navigation Links */}
              <div className="flex-1 px-6 py-8 space-y-2 overflow-y-auto">
                {navLinks.map((link) => {
                  const isActive = isActivePath(link.href);
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200 ${
                        isActive
                          ? 'text-orange-500 bg-orange-500/10'
                          : 'text-slate-300 hover:text-orange-500 hover:bg-slate-800/50'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  );
                })}

                <div className="pt-4 mt-4 border-t border-slate-800">
                  <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Account
                  </div>
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-3 text-base text-slate-300">
                        <div className="font-medium text-orange-400">{user?.userType === 'vendor' ? user.companyName : user?.name || user?.email}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{user?.userType === 'vendor' ? 'Event Manager' : 'Client'}</div>
                      </div>
                      <Link
                        href={user?.userType === 'vendor' ? '/craftsmen/dashboard' : '/dashboard/client'}
                        className="block px-4 py-3 rounded-lg text-base font-medium text-slate-300 hover:text-orange-500 hover:bg-slate-800/50 transition-colors duration-200"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 rounded-lg text-base font-medium text-slate-300 hover:text-orange-500 hover:bg-slate-800/50 transition-colors duration-200 flex items-center space-x-2"
                      >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        <span>Logout</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="block px-4 py-3 rounded-lg text-base font-medium text-slate-300 hover:text-orange-500 hover:bg-slate-800/50 transition-colors duration-200"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Client Login
                      </Link>
                      <Link
                        href="/craftsmen/login"
                        className="block px-4 py-3 rounded-lg text-base font-medium text-slate-300 hover:text-orange-500 hover:bg-slate-800/50 transition-colors duration-200"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Event Manager Login
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Mobile CTA */}
              <div className="flex-shrink-0 border-t border-slate-800 p-6 bg-slate-900">
                <Link
                  href="/forge"
                  className="block w-full px-6 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-base font-semibold rounded-lg shadow-lg shadow-orange-500/30 text-center transition-all duration-300"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Plan an Event
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer to prevent content from hiding under fixed navbar */}
      <div className="h-[72px]" />
    </>
  );
}
