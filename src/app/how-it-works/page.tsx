'use client';

import React from 'react';
import Link from 'next/link';
import {
  SparklesIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CheckCircleIcon,
  UserGroupIcon,
  BoltIcon,
  HeartIcon,
  TrophyIcon,
  CalendarDaysIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-pink-500/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            How EventFoundry Works
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto">
            Connect with India's best event management companies in 3 simple steps. <br />
            Plan smarter, save time, and create extraordinary events.
          </p>
        </div>
      </div>

      {/* For Clients Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-500/20 rounded-full border border-orange-500/30 mb-4">
            <HeartIcon className="w-5 h-5 text-orange-400" />
            <span className="text-orange-300 font-semibold">For Event Planners</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            Find Your Event Management Partner
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Whether you're planning a wedding, corporate event, or celebration, we connect you with India's best full-service event management companies.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            <div className="relative bg-slate-800/90 backdrop-blur-lg border border-slate-700 rounded-2xl p-8 hover:border-orange-500/50 transition-all duration-300">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl mb-6 shadow-lg shadow-orange-500/30">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Post Your Event
              </h3>
              <p className="text-slate-400 leading-relaxed mb-4">
                Tell us about your event - date, location, guest count, and requirements. Our smart questionnaire helps you define exactly what you need.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2 text-sm text-slate-300">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>Takes only 5 minutes</span>
                </li>
                <li className="flex items-center space-x-2 text-sm text-slate-300">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>No signup required</span>
                </li>
                <li className="flex items-center space-x-2 text-sm text-slate-300">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>Free to post</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            <div className="relative bg-slate-800/90 backdrop-blur-lg border border-slate-700 rounded-2xl p-8 hover:border-orange-500/50 transition-all duration-300">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl mb-6 shadow-lg shadow-orange-500/30">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Receive Proposals
              </h3>
              <p className="text-slate-400 leading-relaxed mb-4">
                Event management companies submit detailed proposals with comprehensive pricing. Compare multiple options side-by-side with full transparency.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2 text-sm text-slate-300">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>Detailed pricing breakdown</span>
                </li>
                <li className="flex items-center space-x-2 text-sm text-slate-300">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>View company portfolios</span>
                </li>
                <li className="flex items-center space-x-2 text-sm text-slate-300">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>Compare up to 5 proposals</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            <div className="relative bg-slate-800/90 backdrop-blur-lg border border-slate-700 rounded-2xl p-8 hover:border-orange-500/50 transition-all duration-300">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl mb-6 shadow-lg shadow-orange-500/30">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Select Winner
              </h3>
              <p className="text-slate-400 leading-relaxed mb-4">
                Shortlist your top 5 choices, review portfolios, and select the perfect event management partner. We notify them immediately!
              </p>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2 text-sm text-slate-300">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>Easy comparison tools</span>
                </li>
                <li className="flex items-center space-x-2 text-sm text-slate-300">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>Instant vendor notification</span>
                </li>
                <li className="flex items-center space-x-2 text-sm text-slate-300">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>Secure platform</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* For Vendors Section */}
      <div className="bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500/20 rounded-full border border-blue-500/30 mb-4">
              <TrophyIcon className="w-5 h-5 text-blue-400" />
              <span className="text-blue-300 font-semibold">For Event Management Companies</span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Grow Your Event Business
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Join India's leading event marketplace and connect with clients planning events nationwide. Built exclusively for full-service event management companies.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
              <div className="relative bg-slate-800/90 backdrop-blur-lg border border-slate-700 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mb-6 shadow-lg shadow-blue-500/30">
                  <span className="text-3xl font-bold text-white">1</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Create Profile
                </h3>
                <p className="text-slate-400 leading-relaxed mb-4">
                  Build your professional profile with portfolio, pricing, and services. Share it on social media to attract clients.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2 text-sm text-slate-300">
                    <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Upload unlimited portfolio images</span>
                  </li>
                  <li className="flex items-center space-x-2 text-sm text-slate-300">
                    <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Shareable profile link</span>
                  </li>
                  <li className="flex items-center space-x-2 text-sm text-slate-300">
                    <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>SEO-optimized</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
              <div className="relative bg-slate-800/90 backdrop-blur-lg border border-slate-700 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mb-6 shadow-lg shadow-blue-500/30">
                  <span className="text-3xl font-bold text-white">2</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Submit Proposals
                </h3>
                <p className="text-slate-400 leading-relaxed mb-4">
                  Browse events matching your services. Submit detailed proposals with itemized pricing and portfolio examples.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2 text-sm text-slate-300">
                    <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Detailed event requirements</span>
                  </li>
                  <li className="flex items-center space-x-2 text-sm text-slate-300">
                    <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Attach portfolio samples</span>
                  </li>
                  <li className="flex items-center space-x-2 text-sm text-slate-300">
                    <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Competitive bidding</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
              <div className="relative bg-slate-800/90 backdrop-blur-lg border border-slate-700 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mb-6 shadow-lg shadow-blue-500/30">
                  <span className="text-3xl font-bold text-white">3</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Win Projects
                </h3>
                <p className="text-slate-400 leading-relaxed mb-4">
                  Get notified when shortlisted or selected. Build your reputation with completed projects and client reviews.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2 text-sm text-slate-300">
                    <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Real-time notifications</span>
                  </li>
                  <li className="flex items-center space-x-2 text-sm text-slate-300">
                    <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Client reviews & ratings</span>
                  </li>
                  <li className="flex items-center space-x-2 text-sm text-slate-300">
                    <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Grow your business</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Why Choose EventFoundry?
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            We're revolutionizing how events are planned in India
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-6 hover:border-orange-500/50 transition-all duration-300">
            <BoltIcon className="w-10 h-10 text-orange-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Lightning Fast</h3>
            <p className="text-sm text-slate-400">
              Post your event in 5 minutes. Receive proposals within 24 hours.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-6 hover:border-orange-500/50 transition-all duration-300">
            <CheckCircleIcon className="w-10 h-10 text-green-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Verified Companies</h3>
            <p className="text-sm text-slate-400">
              All event management companies are verified with portfolios, reviews, and ratings.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-6 hover:border-orange-500/50 transition-all duration-300">
            <CurrencyRupeeIcon className="w-10 h-10 text-blue-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Transparent Pricing</h3>
            <p className="text-sm text-slate-400">
              Compare detailed proposals with itemized pricing breakdowns.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl p-6 hover:border-orange-500/50 transition-all duration-300">
            <UserGroupIcon className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">India-Wide Network</h3>
            <p className="text-sm text-slate-400">
              Access event management companies across India for events anywhere in the country.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-purple-500/10 border-y border-orange-500/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Join thousands of clients and event management companies creating extraordinary events together
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/forge"
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-lg font-bold rounded-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all duration-300 transform hover:scale-105"
            >
              Plan an Event
            </Link>
            <Link
              href="/craftsmen/signup"
              className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white text-lg font-bold rounded-lg border border-slate-600 hover:border-slate-500 transition-all duration-300"
            >
              Join as Event Company
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">1,000+</div>
            <div className="text-slate-400">Events Planned</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">500+</div>
            <div className="text-slate-400">Event Companies</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">50+</div>
            <div className="text-slate-400">Cities Covered</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">98%</div>
            <div className="text-slate-400">Success Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}
