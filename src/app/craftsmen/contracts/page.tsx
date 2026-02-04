'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  UserIcon,
  ChevronRightIcon,
  FunnelIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

interface Contract {
  id: string;
  event_id: string;
  client_id: string;
  total_amount: number;
  deposit_amount: number;
  contract_status: 'PENDING' | 'SIGNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  signatures_json: any;
  created_at: string;
  signed_at?: string;
  // Joined data
  event?: any;
  client?: any;
}

type FilterType = 'all' | 'PENDING' | 'SIGNED' | 'ACTIVE' | 'COMPLETED';

export default function VendorContractsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    if (!authLoading) {
      loadContracts();
    }
  }, [authLoading, isAuthenticated]);

  const loadContracts = async () => {
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

      // Fetch contracts for this vendor with client and event details
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select(`
          *,
          event:events(id, event_type, date, city),
          client:users!contracts_client_id_fkey(name, email)
        `)
        .eq('vendor_id', vendorProfile.id)
        .order('created_at', { ascending: false });

      if (contractsError) {
        console.error('Error loading contracts:', contractsError);
        setError('Failed to load contracts');
        setLoading(false);
        return;
      }

      setContracts(contractsData as Contract[] || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading contracts:', error);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'SIGNED':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'ACTIVE':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'COMPLETED':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <ClockIcon className="w-5 h-5" />;
      case 'SIGNED':
      case 'ACTIVE':
        return <SparklesIcon className="w-5 h-5" />;
      case 'COMPLETED':
        return <CheckCircleIcon className="w-5 h-5" />;
      default:
        return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  const getSignatureStatus = (contract: Contract) => {
    const clientSigned = contract.signatures_json?.client?.signed_at;
    const vendorSigned = contract.signatures_json?.vendor?.signed_at;

    if (clientSigned && vendorSigned) {
      return { text: 'Ready to Forge! 🔥', color: 'text-green-400' };
    } else if (clientSigned) {
      return { text: 'Your Signature Required', color: 'text-orange-400' };
    } else {
      return { text: 'Waiting for Client', color: 'text-slate-400' };
    }
  };

  const getFilteredContracts = () => {
    if (filter === 'all') return contracts;
    return contracts.filter(c => c.contract_status === filter);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Loading contracts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">{error}</h1>
          <Link href="/craftsmen/dashboard" className="text-orange-400 hover:text-orange-300">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const filteredContracts = getFilteredContracts();
  const totalEarnings = contracts
    .filter(c => c.contract_status === 'COMPLETED')
    .reduce((sum, c) => sum + (c.total_amount || 0), 0);
  const activeEarnings = contracts
    .filter(c => c.contract_status === 'ACTIVE' || c.contract_status === 'SIGNED')
    .reduce((sum, c) => sum + (c.total_amount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/craftsmen/dashboard"
            className="inline-flex items-center space-x-2 text-slate-300 hover:text-white mb-4 transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5 rotate-180" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                My Contracts
              </h1>
              <p className="text-slate-400">
                {contracts.length} total contract{contracts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Total Contracts</span>
              <DocumentTextIcon className="w-5 h-5 text-slate-500" />
            </div>
            <p className="text-3xl font-bold text-white">{contracts.length}</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Active Projects</span>
              <SparklesIcon className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-blue-400">
              {contracts.filter(c => c.contract_status === 'ACTIVE' || c.contract_status === 'SIGNED').length}
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Completed</span>
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-green-400">
              {contracts.filter(c => c.contract_status === 'COMPLETED').length}
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Total Earned</span>
              <CurrencyRupeeIcon className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-400">
              ₹{(totalEarnings / 100000).toFixed(2)}L
            </p>
          </div>
        </div>

        {/* Active Earnings Banner */}
        {activeEarnings > 0 && (
          <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-blue-300 mb-1">Active Project Value</h3>
                <p className="text-slate-300 text-sm">Total value of ongoing contracts</p>
              </div>
              <p className="text-3xl font-bold text-blue-400">
                ₹{(activeEarnings / 100000).toFixed(2)}L
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 mb-6">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <FunnelIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
            {(['all', 'PENDING', 'SIGNED', 'ACTIVE', 'COMPLETED'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                  filter === f
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                {f !== 'all' && (
                  <span className="ml-1 text-xs opacity-75">
                    ({contracts.filter(c => c.contract_status === f).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Contracts List */}
        {filteredContracts.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-12 text-center">
            <DocumentTextIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No Contracts Found</h3>
            <p className="text-slate-400">
              {filter === 'all'
                ? 'You don\'t have any contracts yet'
                : `No ${filter.toLowerCase()} contracts found`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredContracts.map((contract) => {
              const signatureStatus = getSignatureStatus(contract);

              return (
                <div
                  key={contract.id}
                  className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-orange-500/50 transition-all cursor-pointer"
                  onClick={() => router.push(`/craftsmen/contracts/${contract.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`p-3 rounded-xl ${getStatusColor(contract.contract_status)}`}>
                        {getStatusIcon(contract.contract_status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1">
                              {contract.event?.event_type || 'Event'} Contract
                            </h3>
                            <p className="text-sm text-slate-400">Contract ID: {contract.id}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(contract.contract_status)}`}>
                            {contract.contract_status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div className="flex items-center space-x-2 text-slate-300">
                            <UserIcon className="w-4 h-4 text-slate-500" />
                            <span className="text-sm">{contract.client?.name || 'Client'}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-green-400">
                            <CurrencyRupeeIcon className="w-4 h-4" />
                            <span className="text-sm font-semibold">
                              ₹{contract.total_amount?.toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 text-slate-300">
                            <CalendarIcon className="w-4 h-4 text-slate-500" />
                            <span className="text-sm">
                              {new Date(contract.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <span className={`text-sm font-medium ${signatureStatus.color}`}>
                            {signatureStatus.text}
                          </span>
                          <div className="flex items-center space-x-2 text-orange-400 text-sm font-medium">
                            <span>View Details</span>
                            <ChevronRightIcon className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
