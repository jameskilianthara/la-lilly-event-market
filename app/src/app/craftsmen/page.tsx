'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  SparklesIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  BoltIcon,
  ChartBarIcon,
  UsersIcon,
  CurrencyRupeeIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  WrenchScrewdriverIcon,
  ArrowRightIcon,
  FireIcon
} from '@heroicons/react/24/outline';

export default function CraftsmenLandingPage() {
  const router = useRouter();

  const benefits = [
    {
      icon: UsersIcon,
      title: 'Qualified Leads Only',
      description: 'Every event comes with complete requirements, budget range, and verified client details. No tire-kickers.'
    },
    {
      icon: PaintBrushIcon,
      title: 'AI Visual Toolkit',
      description: 'Generate professional 3D renders and visualizations to showcase your vision. Stand out with stunning proposals.'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Fair Bidding System',
      description: 'Closed bidding ensures fair competition. Shortlisted vendors receive transparent pricing feedback.'
    },
    {
      icon: CurrencyRupeeIcon,
      title: 'Premium Pricing',
      description: 'Clients come ready to invest. Average event budgets 40% higher than traditional platforms.'
    },
    {
      icon: BoltIcon,
      title: 'Instant Notifications',
      description: 'Get notified the moment a relevant event is posted. Respond fast, win more projects.'
    },
    {
      icon: WrenchScrewdriverIcon,
      title: 'Complete Toolkit',
      description: 'Contracts, invoicing, milestone tracking - everything you need to run your craft business.'
    }
  ];

  const stats = [
    { number: '₹2.4Cr+', label: 'Total Event Value' },
    { number: '156', label: 'Active Events' },
    { number: '89%', label: 'Vendor Win Rate' },
    { number: '4.8★', label: 'Avg. Client Rating' }
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Create Your Forge Profile',
      description: 'Showcase your craft specialties, past work, and service areas. Set your availability and pricing structure.'
    },
    {
      step: '02',
      title: 'Receive Qualified Events',
      description: 'Get notified when events matching your expertise are posted. Review complete requirements before bidding.'
    },
    {
      step: '03',
      title: 'Submit Smart Proposals',
      description: 'Use our AI toolkit to create stunning visual proposals. Include itemized pricing and custom solutions.'
    },
    {
      step: '04',
      title: 'Win & Execute',
      description: 'Client reviews all bids, shortlists top 5. Win the project and get paid through secure milestones.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      {/* Navigation */}
      <nav className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FireIcon className="h-8 w-8 text-orange-500" />
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                EventFoundry
              </span>
            </div>
            <button
              onClick={() => router.push('/craftsmen/signup')}
              className="px-6 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-lg text-orange-400 font-semibold transition-all duration-200"
            >
              Join the Foundry
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-blue-500/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-full mb-6">
                <SparklesIcon className="h-4 w-4 text-orange-400" />
                <span className="text-orange-400 text-sm font-semibold">Founding Craftsmen Program Active</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Forge Your Future in
                <span className="block bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                  Event Mastery
                </span>
              </h1>

              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                Join India's most premium event vendor platform. Get qualified leads, showcase your craft with AI-powered tools, and build the business you deserve.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push('/craftsmen/signup')}
                  className="group flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 hover:from-orange-600 hover:via-orange-700 hover:to-orange-600 text-white font-bold rounded-xl shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105"
                >
                  <span>Start Your Craft Journey</span>
                  <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-white font-semibold rounded-xl transition-all duration-200"
                >
                  See How It Works
                </button>
              </div>

              <div className="mt-8 flex items-center space-x-6 text-sm text-slate-400">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  <span>No signup fees</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  <span>6 months free premium</span>
                </div>
              </div>
            </div>

            {/* Hero Image Placeholder */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-orange-500/20 to-blue-500/20 rounded-2xl border border-slate-700/50 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <WrenchScrewdriverIcon className="h-24 w-24 text-orange-400/50 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">Master Craftsman Dashboard Preview</p>
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl opacity-20 blur-2xl"></div>
                <div className="absolute -top-6 -left-6 w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl opacity-20 blur-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-slate-800/50 border-y border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-slate-400 text-sm sm:text-base">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              How the Foundry Works
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Four simple steps from profile to payment. Built for master craftsmen.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 h-full hover:border-orange-500/30 transition-all duration-300">
                  <div className="text-6xl font-bold text-orange-500/20 mb-4">{item.step}</div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-slate-300 leading-relaxed">{item.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-orange-500 to-transparent"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 sm:py-32 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Why Master Craftsmen Choose Us
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Everything you need to grow your event craft business in one platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div
                  key={index}
                  className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 hover:border-orange-500/30 transition-all duration-300 group"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{benefit.title}</h3>
                  <p className="text-slate-300 leading-relaxed">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Founding Craftsmen Offer */}
      <section className="py-20 sm:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-orange-500/20 to-orange-700/20 backdrop-blur-sm rounded-3xl border-2 border-orange-500/30 p-8 sm:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent"></div>
            <div className="relative">
              <div className="flex items-center space-x-3 mb-6">
                <FireIcon className="h-8 w-8 text-orange-400" />
                <span className="text-orange-400 font-bold text-lg">Limited Time Offer</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Founding Craftsmen Program
              </h2>

              <p className="text-xl text-slate-200 mb-8 leading-relaxed">
                Join as a founding member and get <span className="text-orange-400 font-bold">6 months of Premium membership free</span>.
                Plus exclusive benefits, priority support, and your profile featured to all clients.
              </p>

              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-900/50 rounded-xl p-4 border border-orange-500/20">
                  <CheckCircleIcon className="h-6 w-6 text-orange-400 mb-2" />
                  <div className="text-white font-semibold">₹12,000 Value</div>
                  <div className="text-slate-400 text-sm">6 months premium free</div>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-4 border border-orange-500/20">
                  <CheckCircleIcon className="h-6 w-6 text-orange-400 mb-2" />
                  <div className="text-white font-semibold">Featured Profile</div>
                  <div className="text-slate-400 text-sm">Top placement forever</div>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-4 border border-orange-500/20">
                  <CheckCircleIcon className="h-6 w-6 text-orange-400 mb-2" />
                  <div className="text-white font-semibold">Priority Access</div>
                  <div className="text-slate-400 text-sm">See events 24hrs early</div>
                </div>
              </div>

              <button
                onClick={() => router.push('/craftsmen/signup')}
                className="group flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 hover:from-orange-600 hover:via-orange-700 hover:to-orange-600 text-white font-bold rounded-xl shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
              >
                <span>Claim Your Founding Spot</span>
                <RocketLaunchIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <p className="text-slate-400 text-sm mt-4">
                ⏰ Only <span className="text-orange-400 font-semibold">23 spots remaining</span> in this cohort
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-slate-800 to-slate-900 border-t border-slate-700/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Forge Your Event Empire?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Join the future of event vendor business. Where master craftsmen meet premium clients.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/craftsmen/signup')}
              className="group flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 hover:from-orange-600 hover:via-orange-700 hover:to-orange-600 text-white font-bold rounded-xl shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105"
            >
              <span>Join as Master Craftsman</span>
              <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => router.push('/')}
              className="px-8 py-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-white font-semibold rounded-xl transition-all duration-200"
            >
              I'm Looking for Vendors
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900/80 border-t border-slate-700/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <FireIcon className="h-6 w-6 text-orange-500" />
                <span className="text-xl font-bold text-white">EventFoundry</span>
              </div>
              <p className="text-slate-400 text-sm">
                Where extraordinary events are forged by master craftsmen.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">For Craftsmen</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="/craftsmen/signup" className="hover:text-orange-400 transition-colors">Join the Foundry</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Success Stories</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-orange-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700/50 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; 2025 EventFoundry. All rights reserved. Built with precision in Mumbai.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
