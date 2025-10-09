'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BuildingOffice2Icon,
  BoltIcon,
  CheckCircleIcon,
  CurrencyRupeeIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  EnvelopeIcon,
  HeartIcon,
  SparklesIcon,
  TrophyIcon,
  GlobeAltIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

export default function KeralaVendorLandingPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const howItWorks = [
    {
      step: '01',
      title: 'Register Your Company',
      description: 'Share your expertise, service capabilities, and event specialties. Quick 10-minute setup.'
    },
    {
      step: '02',
      title: 'Receive Qualified Leads',
      description: 'We match you with clients planning events nationwide. Complete requirements provided.'
    },
    {
      step: '03',
      title: 'Submit Your Proposal',
      description: 'Present your approach, timeline, and pricing. Showcase your track record and capabilities.'
    },
    {
      step: '04',
      title: 'Win & Execute',
      description: 'Best proposal wins. You handle the event end-to-end. We take commission only when you succeed.'
    }
  ];

  const valueProps = [
    {
      icon: UserGroupIcon,
      title: 'Pre-qualified Clients',
      description: 'Every lead comes with verified requirements, budget range, and timeline. No browsing or tire-kickers—clients ready to book.'
    },
    {
      icon: CurrencyRupeeIcon,
      title: 'Fair Commission',
      description: 'Pay only when you win: 8-12% of project value. No subscriptions, no upfront fees, no hidden costs. Transparent pricing.'
    },
    {
      icon: BuildingOffice2Icon,
      title: 'You Control Everything',
      description: 'Your brand, your pitch, your execution. We connect you with clients, you deliver the magic. Complete operational freedom.'
    }
  ];

  const eventTypes = [
    { icon: HeartIcon, label: 'Destination Weddings', color: 'text-pink-400' },
    { icon: BuildingOffice2Icon, label: 'Corporate Events & Offsites', color: 'text-blue-400' },
    { icon: SparklesIcon, label: 'Cultural Celebrations', color: 'text-orange-400' },
    { icon: TrophyIcon, label: 'Product Launches', color: 'text-green-400' },
    { icon: GlobeAltIcon, label: 'Social Events', color: 'text-purple-400' },
    { icon: CalendarDaysIcon, label: 'Multi-day Events', color: 'text-yellow-400' }
  ];

  const simpleTerms = [
    'No lock-ins or exclusivity—work with any client, any platform',
    'Transparent commission structure—8-12% only when you win',
    'Clear contract terms—no fine print, no surprises',
    'Simple onboarding process—start receiving leads in 48 hours'
  ];

  const faqs = [
    {
      question: 'How does pricing work?',
      answer: 'You pay nothing upfront. When you win a project through EventFoundry, we charge 8-12% commission based on the total project value. If you don\'t win, you don\'t pay. Simple.'
    },
    {
      question: 'What types of events do you send?',
      answer: 'We connect you with all types of events across India: destination weddings, corporate offsites, cultural celebrations, product launches, and multi-day social events. All leads are pre-qualified with complete requirements.'
    },
    {
      question: 'Can I decline leads?',
      answer: 'Absolutely. You\'re in full control. Review each event brief and choose which ones to bid on based on your capacity, expertise, and interest. No penalties for declining.'
    },
    {
      question: 'What if client goes direct after introduction?',
      answer: 'Our contracts protect you. If a client contacts you through EventFoundry and books within 12 months, the commission applies—even if they try to go direct. Legal safeguards in place.'
    },
    {
      question: 'How many event companies compete per lead?',
      answer: 'We invite 5-8 qualified companies per event to ensure fair competition and quality proposals. Clients review all submissions and shortlist their top choices.'
    },
    {
      question: 'Do you provide payment protection?',
      answer: 'Yes. All contracts include milestone-based payment terms. Clients deposit funds into escrow before event execution. You get paid securely as milestones complete.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-blue-500/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full mb-6">
              <GlobeAltIcon className="h-4 w-4 text-blue-400" />
              <span className="text-blue-400 text-sm font-semibold">For Event Management Companies</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Connect with Clients Planning
              <span className="block bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                Events Nationwide
              </span>
            </h1>

            <p className="text-xl text-slate-300 mb-8 leading-relaxed max-w-3xl mx-auto">
              Full-service event management companies: Get qualified leads. Submit proposals. Win events.
              Simple commission structure. No upfront fees.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/craftsmen/signup')}
                className="group flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 hover:from-orange-600 hover:via-orange-700 hover:to-orange-600 text-white font-bold rounded-xl shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300"
              >
                <span>Register Your Event Company</span>
                <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-slate-400">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
                <span>Pay only when you win</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
                <span>Start in 48 hours</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-32 bg-slate-800/30 border-y border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Four straightforward steps from registration to revenue
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

      {/* Value Propositions */}
      <section className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Why Event Companies Choose EventFoundry
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Clear value. Fair terms. Real results.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {valueProps.map((prop, index) => {
              const IconComponent = prop.icon;
              return (
                <div
                  key={index}
                  className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 hover:border-orange-500/30 transition-all duration-300"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center mb-6">
                    <IconComponent className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{prop.title}</h3>
                  <p className="text-slate-300 leading-relaxed">{prop.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Event Types */}
      <section className="py-20 bg-slate-800/30 border-y border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Event Types We Connect
            </h2>
            <p className="text-lg text-slate-300">
              All types of events happening across India and beyond
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {eventTypes.map((event, index) => {
              const IconComponent = event.icon;
              return (
                <div
                  key={index}
                  className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 text-center hover:border-orange-500/30 transition-all duration-300"
                >
                  <IconComponent className={`h-10 w-10 mx-auto mb-3 ${event.color}`} />
                  <p className="text-white text-sm font-medium leading-tight">{event.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Simple Terms */}
      <section className="py-20 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Simple, Fair Terms
            </h2>
            <p className="text-lg text-slate-300">
              No complicated contracts. No hidden fees. Just straightforward business.
            </p>
          </div>

          <div className="space-y-4">
            {simpleTerms.map((term, index) => (
              <div
                key={index}
                className="flex items-start space-x-4 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 hover:border-green-500/30 transition-all duration-300"
              >
                <CheckCircleIcon className="h-6 w-6 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-slate-200 text-lg leading-relaxed">{term}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 sm:py-32 bg-slate-800/30 border-y border-slate-700/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-slate-300">
              Clear answers to common questions
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden hover:border-orange-500/30 transition-all duration-300"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="text-lg font-semibold text-white pr-4">{faq.question}</span>
                  <ChevronDownIcon
                    className={`h-5 w-5 text-slate-400 flex-shrink-0 transition-transform duration-300 ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    openFaq === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  } overflow-hidden`}
                >
                  <div className="px-6 pb-6 text-slate-300 leading-relaxed border-t border-slate-700/50 pt-4">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to grow your event management business?
          </h2>

          <p className="text-xl text-slate-300 mb-10 leading-relaxed">
            Join professional event companies already winning projects through EventFoundry.
            Registration takes 10 minutes. Start receiving leads in 48 hours.
          </p>

          <button
            onClick={() => router.push('/craftsmen/signup')}
            className="group inline-flex items-center justify-center space-x-2 px-10 py-5 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 hover:from-orange-600 hover:via-orange-700 hover:to-orange-600 text-white font-bold text-lg rounded-xl shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105"
          >
            <span>Register Your Event Company</span>
            <ArrowRightIcon className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="mt-8 flex items-center justify-center space-x-2 text-slate-400">
            <EnvelopeIcon className="h-5 w-5" />
            <span>Questions? Email:</span>
            <a
              href="mailto:contact@eventfoundry.com"
              className="text-orange-400 hover:text-orange-300 font-semibold transition-colors"
            >
              contact@eventfoundry.com
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900/80 border-t border-slate-700/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BuildingOffice2Icon className="h-6 w-6 text-orange-500" />
                <span className="text-xl font-bold text-white">EventFoundry</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Connecting event management companies with clients nationwide.
                Fair terms. Real results.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">For Event Companies</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="/craftsmen/signup" className="hover:text-orange-400 transition-colors">Register Company</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Pricing & Terms</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Success Stories</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>
                  <a href="mailto:contact@eventfoundry.com" className="hover:text-orange-400 transition-colors">
                    contact@eventfoundry.com
                  </a>
                </li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700/50 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; 2025 EventFoundry. Empowering event companies nationwide.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
