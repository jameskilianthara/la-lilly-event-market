'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  ArrowDownTrayIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

interface Contract {
  id: string;
  event_id: string;
  bid_id: string;
  vendor_id: string;
  client_id: string;
  contract_json: any;
  pdf_url: string;
  total_amount: number;
  deposit_amount: number;
  milestones: any[];
  contract_status: 'PENDING' | 'SIGNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  signatures_json: any;
  created_at: string;
  signed_at?: string;
  // Joined data
  event?: any;
  vendor?: any;
}

export default function ClientContractReviewPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const contractId = params.contractId as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [signatureData, setSignatureData] = useState({
    fullName: '',
    email: '',
    agreedToTerms: false
  });

  useEffect(() => {
    if (!authLoading) {
      loadContract();
    }
  }, [contractId, authLoading, isAuthenticated]);

  const loadContract = async () => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    try {
      setLoading(true);

      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Fetch contract with vendor and event details
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select(`
          *,
          event:events(*),
          vendor:vendors(*, user:users(*))
        `)
        .eq('id', contractId)
        .single();

      if (contractError) {
        console.error('Error loading contract:', contractError);
        setError('Failed to load contract');
        setLoading(false);
        return;
      }

      if (!contractData) {
        setError('Contract not found');
        setLoading(false);
        return;
      }

      // Check if user owns this contract
      if (contractData.client_id !== user.userId) {
        setError('You do not have permission to view this contract');
        setLoading(false);
        return;
      }

      setContract(contractData as Contract);
      setSignatureData({
        fullName: user.name || '',
        email: user.email || '',
        agreedToTerms: false
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading contract:', error);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!contract || !signatureData.agreedToTerms) {
      return;
    }

    setSigning(true);

    try {
      const response = await fetch(`/api/contracts/${contractId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerId: user?.userId,
          signerRole: 'client',
          fullName: signatureData.fullName,
          email: signatureData.email
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sign contract');
      }

      // Reload contract to show updated status
      await loadContract();

      alert('Contract signed successfully! The vendor will be notified.');
    } catch (error) {
      console.error('Error signing contract:', error);
      alert(error instanceof Error ? error.message : 'Failed to sign contract');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Loading contract...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">{error || 'Contract Not Found'}</h1>
          <Link href="/dashboard/client" className="text-orange-400 hover:text-orange-300">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const contractJSON = contract.contract_json;
  const vendorUser = contract.vendor?.user;
  const clientSigned = contract.signatures_json?.client?.signed_at;
  const vendorSigned = contract.signatures_json?.vendor?.signed_at;
  const isFullySigned = clientSigned && vendorSigned;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/dashboard/client/events/${contract.event_id}`}
            className="inline-flex items-center space-x-2 text-slate-300 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Event</span>
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Forge Commission Contract
              </h1>
              <p className="text-slate-400">Contract ID: {contract.id}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              contract.contract_status === 'SIGNED' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
              contract.contract_status === 'ACTIVE' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
              contract.contract_status === 'COMPLETED' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
              'bg-orange-500/20 text-orange-300 border border-orange-500/30'
            }`}>
              {contract.contract_status}
            </span>
          </div>
        </div>

        {/* Status Banner */}
        {isFullySigned && (
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-3">
              <CheckCircleIcon className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-green-300 mb-1">Contract Fully Signed ✓</h3>
                <p className="text-slate-300">Both parties have signed. Work can now begin!</p>
              </div>
            </div>
          </div>
        )}

        {!clientSigned && (
          <div className="bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-3">
              <ClockIcon className="w-6 h-6 text-orange-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-orange-300 mb-1">Your Signature Required</h3>
                <p className="text-slate-300">Please review and sign the contract below</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Contract Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contract Summary */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <DocumentTextIcon className="w-6 h-6 text-orange-400" />
                <span>Contract Summary</span>
              </h2>

              <div className="space-y-4">
                <div className="flex items-start justify-between py-3 border-b border-slate-700/50">
                  <span className="text-slate-400">Event Title</span>
                  <span className="text-white font-medium text-right">{contractJSON?.eventTitle || 'Event'}</span>
                </div>

                <div className="flex items-start justify-between py-3 border-b border-slate-700/50">
                  <span className="text-slate-400">Total Investment</span>
                  <span className="text-2xl font-bold text-orange-400">
                    ₹{contract.total_amount?.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-start justify-between py-3 border-b border-slate-700/50">
                  <span className="text-slate-400">Deposit Amount (30%)</span>
                  <span className="text-xl font-semibold text-green-400">
                    ₹{contract.deposit_amount?.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-start justify-between py-3">
                  <span className="text-slate-400">Created On</span>
                  <span className="text-white">
                    {new Date(contract.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Milestones */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <CurrencyRupeeIcon className="w-6 h-6 text-orange-400" />
                <span>Payment Milestones</span>
              </h2>

              <div className="space-y-3">
                {contract.milestones?.map((milestone: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{milestone.description}</p>
                      <p className="text-sm text-slate-400">{milestone.percentage}%</p>
                    </div>
                    <span className="text-lg font-semibold text-orange-400">
                      ₹{milestone.amount?.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contract Terms */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Terms & Conditions</h2>
              <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                {contractJSON?.terms && (
                  <div dangerouslySetInnerHTML={{ __html: contractJSON.terms }} />
                )}
                {!contractJSON?.terms && (
                  <ul className="space-y-2">
                    <li>Master Craftsman Warranty: All work forged to EventFoundry premium standards</li>
                    <li>Timeline: Work to commence within 7 days of contract signing</li>
                    <li>Cancellation: 14-day cancellation window with deposit refund minus 10% processing fee</li>
                    <li>Changes: Scope changes require written approval and may adjust total investment</li>
                  </ul>
                )}
              </div>
            </div>

            {/* PDF Download */}
            {contract.pdf_url && (
              <a
                href={contract.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 w-full px-6 py-4 bg-slate-700/50 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all border border-slate-600"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                <span>Download Contract PDF</span>
              </a>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Vendor Details */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                <BuildingOfficeIcon className="w-5 h-5 text-orange-400" />
                <span>Master Craftsman</span>
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Company</p>
                  <p className="text-white font-medium">{contract.vendor?.company_name || 'Vendor'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Contact Person</p>
                  <p className="text-white">{vendorUser?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Email</p>
                  <p className="text-white text-sm">{vendorUser?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Phone</p>
                  <p className="text-white">{contract.vendor?.phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Signature Status */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Signature Status</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Client (You)</span>
                  {clientSigned ? (
                    <span className="flex items-center space-x-1 text-green-400">
                      <CheckCircleIcon className="w-5 h-5" />
                      <span className="text-sm">Signed</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-orange-400">
                      <ClockIcon className="w-5 h-5" />
                      <span className="text-sm">Pending</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Vendor</span>
                  {vendorSigned ? (
                    <span className="flex items-center space-x-1 text-green-400">
                      <CheckCircleIcon className="w-5 h-5" />
                      <span className="text-sm">Signed</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-slate-400">
                      <ClockIcon className="w-5 h-5" />
                      <span className="text-sm">Pending</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Sign Contract Form */}
            {!clientSigned && (
              <div className="bg-gradient-to-br from-orange-500/10 to-pink-500/10 border-2 border-orange-500/30 rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                  <PencilSquareIcon className="w-5 h-5 text-orange-400" />
                  <span>Sign Contract</span>
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={signatureData.fullName}
                      onChange={(e) => setSignatureData({ ...signatureData, fullName: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={signatureData.email}
                      onChange={(e) => setSignatureData({ ...signatureData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={signatureData.agreedToTerms}
                      onChange={(e) => setSignatureData({ ...signatureData, agreedToTerms: e.target.checked })}
                      className="mt-1 w-5 h-5 rounded border-2 border-slate-500 bg-slate-700 checked:bg-orange-500 checked:border-orange-500 cursor-pointer"
                    />
                    <label className="text-sm text-slate-300">
                      I have reviewed and agree to the terms and conditions of this contract. I understand that this signature is legally binding.
                    </label>
                  </div>

                  <button
                    onClick={handleSign}
                    disabled={signing || !signatureData.agreedToTerms || !signatureData.fullName || !signatureData.email}
                    className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold rounded-xl transition-all shadow-lg disabled:cursor-not-allowed"
                  >
                    {signing ? 'Signing...' : 'Sign Contract'}
                  </button>

                  <p className="text-xs text-slate-400 text-center">
                    Digital signature captured with timestamp and IP address for legal verification
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
