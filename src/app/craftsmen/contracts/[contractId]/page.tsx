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
  UserIcon,
  ArrowDownTrayIcon,
  PencilSquareIcon,
  SparklesIcon
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
  client?: any;
}

export default function VendorContractReviewPage() {
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
      router.push('/craftsmen/login');
      return;
    }

    try {
      setLoading(true);

      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Get vendor ID from vendors table
      const { data: vendorProfile, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.userId)
        .single();

      if (vendorError || !vendorProfile) {
        setError('Vendor profile not found');
        setLoading(false);
        return;
      }

      // Fetch contract with client and event details
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select(`
          *,
          event:events(*),
          client:users!contracts_client_id_fkey(*)
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

      // Check if vendor owns this contract
      if (contractData.vendor_id !== vendorProfile.id) {
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
          signerRole: 'vendor',
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

      alert('Contract signed successfully! You can now begin work on the project.');
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
          <Link href="/craftsmen/dashboard" className="text-orange-400 hover:text-orange-300">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const contractJSON = contract.contract_json;
  const clientUser = contract.client;
  const clientSigned = contract.signatures_json?.client?.signed_at;
  const vendorSigned = contract.signatures_json?.vendor?.signed_at;
  const isFullySigned = clientSigned && vendorSigned;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/craftsmen/dashboard"
            className="inline-flex items-center space-x-2 text-slate-300 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Dashboard</span>
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

        {/* Status Banners */}
        {isFullySigned && (
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-3">
              <SparklesIcon className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-green-300 mb-1">Ready to Forge! 🔥</h3>
                <p className="text-slate-300">Contract fully signed. You can begin work on this project.</p>
              </div>
            </div>
          </div>
        )}

        {clientSigned && !vendorSigned && (
          <div className="bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-3">
              <ClockIcon className="w-6 h-6 text-orange-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-orange-300 mb-1">Client Has Signed - Your Turn!</h3>
                <p className="text-slate-300">The client has signed the contract. Please review and sign to begin work.</p>
              </div>
            </div>
          </div>
        )}

        {!clientSigned && (
          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-3">
              <ClockIcon className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-blue-300 mb-1">Waiting for Client Signature</h3>
                <p className="text-slate-300">The client needs to sign first. You'll be notified when it's your turn.</p>
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
                  <span className="text-slate-400">Project</span>
                  <span className="text-white font-medium text-right">{contractJSON?.eventTitle || 'Event'}</span>
                </div>

                <div className="flex items-start justify-between py-3 border-b border-slate-700/50">
                  <span className="text-slate-400">Total Commission</span>
                  <span className="text-2xl font-bold text-green-400">
                    ₹{contract.total_amount?.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-start justify-between py-3 border-b border-slate-700/50">
                  <span className="text-slate-400">Advance (30%)</span>
                  <span className="text-xl font-semibold text-orange-400">
                    ₹{contract.deposit_amount?.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-start justify-between py-3">
                  <span className="text-slate-400">Contract Date</span>
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

            {/* Payment Schedule */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <CurrencyRupeeIcon className="w-6 h-6 text-orange-400" />
                <span>Payment Schedule</span>
              </h2>

              <div className="space-y-3">
                {contract.milestones?.map((milestone: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{milestone.description}</p>
                      <p className="text-sm text-slate-400">{milestone.percentage}% of total</p>
                    </div>
                    <span className="text-lg font-semibold text-green-400">
                      ₹{milestone.amount?.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scope of Work */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Scope of Work</h2>
              <div className="text-slate-300 space-y-2">
                <p>All services and deliverables as specified in your accepted bid proposal, including:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>All line items from your submitted proposal</li>
                  <li>Timeline: {contractJSON?.timeline || 'As per bid'}</li>
                  <li>Quality standards: EventFoundry premium forge specifications</li>
                  <li>Client requirements: As documented in event blueprint</li>
                </ul>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Terms & Conditions</h2>
              <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                <ul className="space-y-2">
                  <li><strong>Quality Guarantee:</strong> All work must meet EventFoundry forge quality standards</li>
                  <li><strong>Timeline:</strong> Work to commence within 7 days of contract signing</li>
                  <li><strong>Payment Terms:</strong> Payments released upon milestone completion and client approval</li>
                  <li><strong>Warranty:</strong> 30-day warranty on all materials and workmanship</li>
                  <li><strong>Changes:</strong> Scope changes require written client approval and may adjust compensation</li>
                  <li><strong>Cancellation:</strong> Client may cancel within 14 days; vendor compensated for work completed</li>
                </ul>
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
            {/* Client Details */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                <UserIcon className="w-5 h-5 text-orange-400" />
                <span>Client Details</span>
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Name</p>
                  <p className="text-white font-medium">{clientUser?.name || 'Client'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Email</p>
                  <p className="text-white text-sm">{clientUser?.email || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Signature Status */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Signature Status</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Client</span>
                  {clientSigned ? (
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
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">You (Vendor)</span>
                  {vendorSigned ? (
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
              </div>
            </div>

            {/* Sign Contract Form */}
            {clientSigned && !vendorSigned && (
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
                      I have reviewed and agree to the terms and conditions of this contract. I understand that this signature is legally binding and I commit to delivering the agreed services.
                    </label>
                  </div>

                  <button
                    onClick={handleSign}
                    disabled={signing || !signatureData.agreedToTerms || !signatureData.fullName || !signatureData.email}
                    className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold rounded-xl transition-all shadow-lg disabled:cursor-not-allowed"
                  >
                    {signing ? 'Signing...' : 'Sign & Accept Contract'}
                  </button>

                  <p className="text-xs text-slate-400 text-center">
                    Digital signature captured with timestamp and IP address for legal verification
                  </p>
                </div>
              </div>
            )}

            {!clientSigned && (
              <div className="bg-slate-700/30 border border-slate-600 rounded-xl p-6 text-center">
                <ClockIcon className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">
                  Waiting for client to sign first. You'll be able to sign once they've completed their signature.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
