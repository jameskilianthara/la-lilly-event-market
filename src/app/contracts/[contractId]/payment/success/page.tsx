'use client';

/**
 * Payment Success Page
 * /contracts/[contractId]/payment/success
 *
 * Shown after successful payment completion
 */

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../../../../lib/supabase';
import { formatIndianCurrency } from '@/lib/commission';

export default function PaymentSuccessPage() {
  const { contractId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id');

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<any>(null);
  const [contract, setContract] = useState<any>(null);

  useEffect(() => {
    loadPaymentDetails();
  }, [contractId, paymentId]);

  const loadPaymentDetails = async () => {
    try {
      // Fetch payment details
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select(
          `
          *,
          contracts (
            *,
            events (
              id,
              title
            ),
            bids (
              vendors (
                company_name
              )
            )
          )
        `
        )
        .eq('contract_id', contractId)
        .single();

      if (paymentError || !paymentData) {
        console.error('Error loading payment:', paymentError);
        setLoading(false);
        return;
      }

      setPayment(paymentData);
      setContract(paymentData.contracts);
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-12 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-green-100">Your payment has been processed successfully</p>
          </div>

          {/* Payment Details */}
          <div className="px-8 py-6">
            <div className="space-y-4">
              {/* Amount Paid */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-600">Amount Paid</span>
                <span className="text-2xl font-bold text-gray-900">
                  {payment ? formatIndianCurrency(payment.amount) : '—'}
                </span>
              </div>

              {/* Contract Details */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Event</span>
                <span className="font-semibold text-gray-900">{contract?.events?.title || '—'}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Vendor</span>
                <span className="font-semibold text-gray-900">{contract?.bids?.vendors?.company_name || '—'}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment ID</span>
                <span className="text-sm text-gray-500 font-mono">
                  {payment?.razorpay_payment_id?.substring(0, 20) || paymentId || '—'}...
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Transaction Date</span>
                <span className="text-sm text-gray-900">
                  {payment?.client_paid_at
                    ? new Date(payment.client_paid_at).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="px-8 py-6 bg-blue-50 border-t border-blue-100">
            <h3 className="font-semibold text-blue-900 mb-3">What happens next?</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Your vendor will be notified and receive payment within 48-72 hours</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>You will receive a payment receipt via email</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Your vendor will begin work as per the contract timeline</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Track your project progress in your dashboard</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push(`/contracts/${contractId}`)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-800 text-white rounded-lg font-semibold hover:from-pink-700 hover:to-purple-900 transition-all"
              >
                View Contract
              </button>
              <button
                onClick={() => router.push('/dashboard/client')}
                className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Download Receipt */}
        <div className="mt-6 text-center">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
              />
            </svg>
            <span>Download Receipt</span>
          </button>
        </div>

        {/* Support */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Questions? Contact us at{' '}
          <a href="mailto:forge@eventfoundry.com" className="text-pink-600 hover:text-pink-700">
            forge@eventfoundry.com
          </a>
        </div>
      </div>
    </div>
  );
}
