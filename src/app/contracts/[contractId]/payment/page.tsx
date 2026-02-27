'use client';

/**
 * Contract Payment Page
 * /contracts/[contractId]/payment
 *
 * Client pays for signed contract with commission breakdown
 */

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import PaymentForm from '@/components/payments/PaymentForm';
import { supabase } from '../../../../../lib/supabase';
import { calculateCommission } from '@/lib/commission';

export default function ContractPaymentPage() {
  const { contractId } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contract, setContract] = useState<any>(null);
  const [commission, setCommission] = useState<any>(null);
  const [phone, setPhone] = useState<string>('');

  // =====================================================
  // LOAD CONTRACT DATA
  // =====================================================

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadContractData();
  }, [contractId, isAuthenticated]);

  const loadContractData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch contract with related data
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select(
          `
          *,
          events (
            id,
            title,
            owner_user_id,
            client_brief
          ),
          bids (
            id,
            total_forge_cost,
            vendor_id,
            vendors (
              id,
              company_name,
              user_id
            )
          )
        `
        )
        .eq('id', contractId)
        .single();

      if (contractError || !contractData) {
        setError('Contract not found');
        setLoading(false);
        return;
      }

      // Verify user is the event owner
      if (contractData.events.owner_user_id !== user?.userId) {
        setError('You are not authorized to view this contract');
        setLoading(false);
        return;
      }

      // Check contract status
      if (contractData.status !== 'SIGNED') {
        setError('Contract must be signed before payment');
        setLoading(false);
        return;
      }

      // Check if payment already exists
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('*')
        .eq('contract_id', contractId)
        .single();

      if (existingPayment && existingPayment.status === 'COMPLETED') {
        router.push(`/contracts/${contractId}`);
        return;
      }

      // Fetch user phone for Razorpay prefill
      const { data: userProfile } = await supabase
        .from('users')
        .select('phone')
        .eq('id', user?.userId)
        .single();

      // Calculate commission
      const projectValue = contractData.bids.total_forge_cost;
      const commissionData = calculateCommission(projectValue);

      setContract(contractData);
      setCommission(commissionData);
      setPhone(userProfile?.phone || '');
      setLoading(false);
    } catch (err) {
      console.error('Error loading contract:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contract');
      setLoading(false);
    }
  };

  // =====================================================
  // HANDLE PAYMENT SUCCESS
  // =====================================================

  const handlePaymentSuccess = (paymentId: string) => {
    // Redirect to success page
    router.push(`/contracts/${contractId}/payment/success?payment_id=${paymentId}`);
  };

  // =====================================================
  // HANDLE PAYMENT FAILURE
  // =====================================================

  const handlePaymentFailure = (errorMessage: string) => {
    setError(errorMessage);
  };

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-pink-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR STATE
  // =====================================================

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Available</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard/client')}
            className="px-6 py-3 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAYMENT FORM
  // =====================================================

  if (!contract || !commission) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Complete Your Payment</h1>
          <p className="text-gray-600">
            Secure payment for your event contract with {contract.bids.vendors.company_name}
          </p>
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/contracts/${contractId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Contract</span>
          </button>
        </div>

        {/* Payment Form */}
        <PaymentForm
          contractId={contract.id}
          amount={contract.bids.total_forge_cost}
          commission={commission}
          userId={user?.userId || ''}
          contractDetails={{
            title: contract.events.title,
            vendorName: contract.bids.vendors.company_name,
          }}
          clientDetails={{
            name: (user?.userType === 'client' ? user.name : undefined) || '',
            email: user?.email || '',
            phone: phone,
          }}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
        />

        {/* Terms and Conditions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Payment Terms & Conditions</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                Platform commission of {commission.commissionRate}% + ₹{commission.platformFee} platform fee will be deducted
              </span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Vendor will receive ₹{commission.vendorPayout.toLocaleString('en-IN')} within 48-72 hours</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>All payments are processed securely via Razorpay (PCI DSS compliant)</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Refunds are subject to EventFoundry's cancellation policy and contract terms</span>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Need help? Contact us at{' '}
          <a href="mailto:forge@eventfoundry.com" className="text-pink-600 hover:text-pink-700">
            forge@eventfoundry.com
          </a>
        </div>
      </div>
    </div>
  );
}
