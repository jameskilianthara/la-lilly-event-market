'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bars3Icon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (loginDropdownOpen) setLoginDropdownOpen(false);
    };
    if (loginDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [loginDropdownOpen]);

  const isActivePath = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const navLinks = [
    { name: 'For Clients', href: '/' },
    { name: 'For Event Managers', href: '/craftsmen' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'About', href: '/about' }
  ];

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
          <div className="fixed inset-0 top-[72px] bg-slate-900/98 backdrop-blur-lg md:hidden z-40">
            <div className="flex flex-col h-full">
              {/* Mobile Navigation Links */}
              <div className="flex-1 px-6 py-8 space-y-1 overflow-y-auto">
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
                </div>
              </div>

              {/* Mobile CTA */}
              <div className="border-t border-slate-800 p-6">
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
