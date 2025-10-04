'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  Calendar,
  Users,
  Award,
  Clock,
  Check,
  Heart,
  MessageCircle,
  Shield,
  Crown,
  Target,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { SAMPLE_COMPREHENSIVE_PROPOSALS, DetailedProposal } from '../../data/sampleProposals';

export default function SampleProposalsPage() {
  const [selectedProposal, setSelectedProposal] = useState<DetailedProposal | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFavorite = (companyId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(companyId)) {
      newFavorites.delete(companyId);
    } else {
      newFavorites.add(companyId);
    }
    setFavorites(newFavorites);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/vendor-proposals"
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-blue-600 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Live Proposals
          </Link>
          
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">Sample: Event Management Proposals</h1>
                <p className="text-blue-100">Priya & Arjun&apos;s Traditional Wedding - March 15, 2025</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-blue-100">Event Type</div>
                <div className="font-semibold">Traditional Wedding</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-blue-100">Guest Count</div>
                <div className="font-semibold">300 people</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-blue-100">Budget Range</div>
                <div className="font-semibold">₹8-12 Lakhs</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-blue-100">Proposals Received</div>
                <div className="font-semibold text-yellow-300">3 Comprehensive</div>
              </div>
            </div>
          </div>
        </div>

        {/* Proposals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {SAMPLE_COMPREHENSIVE_PROPOSALS.map((proposal, index) => (
            <motion.div
              key={proposal.companyId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              {/* Company Header */}
              <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-neutral-900 mb-1">
                      {proposal.companyName}
                    </h3>
                    <p className="text-blue-600 font-medium text-sm">
                      by {proposal.ownerName}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleFavorite(proposal.companyId)}
                    className={`p-2 rounded-full transition-colors ${
                      favorites.has(proposal.companyId)
                        ? 'bg-red-100 text-red-600'
                        : 'bg-neutral-100 text-neutral-400 hover:text-red-500'
                    }`}
                  >
                    <Heart className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${
                          i < Math.floor(proposal.rating) 
                            ? 'text-yellow-400 fill-yellow-400' 
                            : 'text-gray-300'
                        }`} 
                      />
                    ))}
                    <span className="text-neutral-600 ml-1">
                      {proposal.rating} ({proposal.reviewCount})
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <Clock className="w-4 h-4" />
                    <span>{proposal.responseTime}</span>
                  </div>
                </div>
              </div>

              {/* Proposal Preview */}
              <div className="p-6">
                {/* Recommended Package */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-600">Recommended Package</span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                      Best Value
                    </span>
                  </div>
                  <h4 className="font-semibold text-neutral-900 mb-1">
                    {proposal.packages[0].packageName}
                  </h4>
                  <p className="text-2xl font-bold text-neutral-900 mb-2">
                    {formatCurrency(proposal.packages[0].totalCost)}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {proposal.packages[0].description}
                  </p>
                </div>

                {/* Key Highlights */}
                <div className="mb-6">
                  <h5 className="font-medium text-neutral-900 mb-2">Why Choose Us:</h5>
                  <div className="space-y-1">
                    {proposal.whyChooseUs.slice(0, 3).map((reason, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-neutral-600">{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedProposal(proposal)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105"
                  >
                    View Full Proposal
                  </button>
                  <button className="p-3 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors">
                    <MessageCircle className="w-5 h-5 text-neutral-600" />
                  </button>
                </div>
              </div>

              {/* Package Options */}
              {proposal.packages.length > 1 && (
                <div className="border-t border-neutral-100 p-4 bg-neutral-50">
                  <div className="text-sm font-medium text-neutral-700 mb-2">
                    {proposal.packages.length} Package Options Available
                  </div>
                  <div className="flex gap-2">
                    {proposal.packages.map((pkg, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-2 text-xs flex-1">
                        <div className="font-medium text-neutral-900 truncate">{pkg.packageName}</div>
                        <div className="text-blue-600">{formatCurrency(pkg.totalCost)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Detailed Proposal Modal */}
        <AnimatePresence>
          {selectedProposal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedProposal(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">{selectedProposal.companyName}</h2>
                      <p className="text-blue-100">Comprehensive Wedding Management Proposal</p>
                    </div>
                    <button
                      onClick={() => setSelectedProposal(null)}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Tab Navigation */}
                  <div className="flex gap-4 mt-6">
                    {['overview', 'packages', 'breakdown', 'timeline'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                          activeTab === tab
                            ? 'bg-white text-blue-600'
                            : 'text-blue-100 hover:bg-white/20'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Personal Message */}
                      <div className="bg-blue-50 rounded-xl p-6">
                        <h3 className="font-semibold text-blue-900 mb-3">Personal Message from {selectedProposal.ownerName}</h3>
                        <p className="text-blue-800">{selectedProposal.personalMessage}</p>
                      </div>

                      {/* Why Choose Us */}
                      <div>
                        <h3 className="font-semibold text-neutral-900 mb-4">Why Choose {selectedProposal.companyName}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {selectedProposal.whyChooseUs.map((reason, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <Check className="w-4 h-4 text-green-600" />
                              </div>
                              <span className="text-neutral-700">{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Complimentary Services */}
                      <div>
                        <h3 className="font-semibold text-neutral-900 mb-4">Complimentary Services Included</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {selectedProposal.complimentaryServices.map((service, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-amber-500" />
                              <span className="text-neutral-700 text-sm">{service}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'packages' && (
                    <div className="space-y-6">
                      {selectedProposal.packages.map((pkg, idx) => (
                        <div key={idx} className="border rounded-xl p-6 hover:border-blue-300 transition-colors">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-neutral-900 mb-2">{pkg.packageName}</h3>
                              <p className="text-neutral-600 mb-3">{pkg.description}</p>
                              <div className="text-3xl font-bold text-blue-600">{formatCurrency(pkg.totalCost)}</div>
                            </div>
                            {idx === 0 && (
                              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                Recommended
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            {pkg.includes.map((item, itemIdx) => (
                              <div key={itemIdx} className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-neutral-700">{item}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-neutral-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{pkg.timeline}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{pkg.teamAssigned.length} specialists assigned</span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Upgrade Options */}
                      <div>
                        <h3 className="font-semibold text-neutral-900 mb-4">Available Upgrades</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedProposal.upgradeOptions.map((upgrade, idx) => (
                            <div key={idx} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-neutral-900">{upgrade.service}</h4>
                                <span className="text-green-600 font-semibold">+{formatCurrency(upgrade.additionalCost)}</span>
                              </div>
                              <p className="text-sm text-neutral-600">{upgrade.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'breakdown' && (
                    <div className="space-y-6">
                      {selectedProposal.detailedBreakdown.map((category, idx) => (
                        <div key={idx} className="border rounded-xl overflow-hidden">
                          <div className="bg-neutral-50 p-4 border-b">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-neutral-900">{category.category}</h3>
                              <span className="font-bold text-lg text-blue-600">
                                {formatCurrency(category.subtotal)}
                              </span>
                            </div>
                          </div>
                          <div className="p-4 space-y-4">
                            {category.items.map((item, itemIdx) => (
                              <div key={itemIdx} className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-neutral-900 mb-1">{item.service}</h4>
                                  <p className="text-sm text-neutral-600">{item.description}</p>
                                </div>
                                <div className="text-right ml-4">
                                  <div className="font-semibold text-neutral-900">
                                    {formatCurrency(item.cost)}
                                  </div>
                                  {item.included && (
                                    <span className="text-xs text-green-600 font-medium">Included</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Payment Schedule */}
                      <div className="border rounded-xl p-6">
                        <h3 className="font-semibold text-neutral-900 mb-4">Payment Schedule</h3>
                        <div className="space-y-3">
                          {selectedProposal.paymentSchedule.map((payment, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                              <div>
                                <div className="font-medium text-neutral-900">{payment.phase}</div>
                                <div className="text-sm text-neutral-600">{payment.dueDate}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-neutral-900">
                                  {formatCurrency(payment.amount)}
                                </div>
                                <div className="text-sm text-neutral-600">{payment.percentage}%</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'timeline' && (
                    <div className="space-y-6">
                      {selectedProposal.timeline.map((phase, idx) => (
                        <div key={idx} className="relative">
                          {idx < selectedProposal.timeline.length - 1 && (
                            <div className="absolute left-6 top-12 w-0.5 h-16 bg-blue-200"></div>
                          )}
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <div className="w-6 h-6 bg-blue-600 rounded-full"></div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-neutral-900">{phase.phase}</h3>
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                                  {phase.duration}
                                </span>
                              </div>
                              <div className="space-y-2">
                                {phase.activities.map((activity, actIdx) => (
                                  <div key={actIdx} className="flex items-start gap-2">
                                    <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-neutral-700 text-sm">{activity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="border-t bg-neutral-50 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-neutral-600">Proposal valid until</div>
                      <div className="font-medium text-neutral-900">{selectedProposal.validUntil}</div>
                    </div>
                    <div className="flex gap-3">
                      <button className="px-6 py-3 border border-neutral-300 text-neutral-700 rounded-xl font-medium hover:border-blue-400 hover:text-blue-600 transition-colors">
                        Download PDF
                      </button>
                      <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200">
                        Contact Company
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comparison Note */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">Sample Proposal Showcase</h3>
              <p className="text-amber-800 mb-3">
                This demonstrates how comprehensive event management companies submit detailed, professional proposals 
                that cover every aspect of your event from planning to execution.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-amber-700">Complete end-to-end service coordination</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-amber-700">Transparent pricing with detailed breakdowns</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-amber-700">Professional timeline and payment scheduling</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-amber-700">Multiple package options to suit different budgets</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}