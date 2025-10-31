'use client';

/**
 * PaymentForm Component
 * Razorpay payment integration for client contract payments
 */

import React, { useState, useEffect } from 'react';
import { formatIndianCurrency } from '@/lib/commission';

interface PaymentFormProps {
  contractId: string;
  amount: number;
  commission: {
    commissionAmount: number;
    platformFee: number;
    vendorPayout: number;
    commissionRate: number;
    tier: string;
  };
  contractDetails: {
    title: string;
    vendorName: string;
  };
  clientDetails: {
    name: string;
    email: string;
    phone: string;
  };
  onSuccess?: (paymentId: string) => void;
  onFailure?: (error: string) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentForm({
  contractId,
  amount,
  commission,
  contractDetails,
  clientDetails,
  onSuccess,
  onFailure,
}: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // =====================================================
  // LOAD RAZORPAY SCRIPT
  // =====================================================

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => {
      setError('Failed to load Razorpay. Please check your internet connection.');
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // =====================================================
  // CREATE PAYMENT ORDER
  // =====================================================

  const createPaymentOrder = async () => {
    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId,
          userId: clientDetails.email, // This should be actual userId from auth
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create payment order');
      }

      return result.data;
    } catch (err) {
      throw err;
    }
  };

  // =====================================================
  // VERIFY PAYMENT
  // =====================================================

  const verifyPayment = async (paymentResponse: any) => {
    try {
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Payment verification failed');
      }

      return result.data;
    } catch (err) {
      throw err;
    }
  };

  // =====================================================
  // HANDLE PAYMENT
  // =====================================================

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      setError('Payment system is still loading. Please wait...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Create payment order
      const orderData = await createPaymentOrder();

      // Step 2: Configure Razorpay options
      const options = {
        key: orderData.razorpayKeyId,
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        name: 'EventFoundry',
        description: `Payment for ${contractDetails.title}`,
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: clientDetails.name,
          email: clientDetails.email,
          contact: clientDetails.phone,
        },
        notes: {
          contract_id: contractId,
          vendor_name: contractDetails.vendorName,
        },
        theme: {
          color: '#db2777', // EventFoundry brand color
        },
        handler: async function (response: any) {
          try {
            // Payment successful - verify signature
            await verifyPayment(response);

            // Call success callback
            if (onSuccess) {
              onSuccess(response.razorpay_payment_id);
            }
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Payment verification failed';
            setError(errorMessage);
            if (onFailure) {
              onFailure(errorMessage);
            }
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setError('Payment cancelled');
          },
        },
      };

      // Step 3: Open Razorpay checkout
      const razorpay = new window.Razorpay(options);

      razorpay.on('payment.failed', function (response: any) {
        const errorMessage = response.error.description || 'Payment failed';
        setError(errorMessage);
        if (onFailure) {
          onFailure(errorMessage);
        }
        setLoading(false);
      });

      razorpay.open();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate payment';
      setError(errorMessage);
      if (onFailure) {
        onFailure(errorMessage);
      }
      setLoading(false);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Payment Summary Card */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-800 text-white px-6 py-4">
          <h2 className="text-2xl font-bold">Complete Your Payment</h2>
          <p className="text-pink-100 text-sm mt-1">{contractDetails.title}</p>
        </div>

        {/* Contract Details */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Vendor</span>
            <span className="font-semibold text-gray-900">{contractDetails.vendorName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Contract ID</span>
            <span className="text-sm text-gray-500 font-mono">{contractId.substring(0, 8)}...</span>
          </div>
        </div>

        {/* Amount Breakdown */}
        <div className="px-6 py-4">
          {/* Total Amount */}
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold text-gray-900">Total Amount</span>
            <span className="text-3xl font-bold text-gray-900">{formatIndianCurrency(amount)}</span>
          </div>

          {/* Breakdown Toggle */}
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="text-pink-600 text-sm font-medium hover:text-pink-700 flex items-center gap-1"
          >
            {showBreakdown ? '− Hide' : '+ Show'} payment breakdown
          </button>

          {/* Breakdown Details */}
          {showBreakdown && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Project Value</span>
                <span className="font-medium">{formatIndianCurrency(amount)}</span>
              </div>
              <div className="flex justify-between text-pink-600">
                <span>Platform Commission ({commission.commissionRate}%)</span>
                <span>− {formatIndianCurrency(commission.commissionAmount)}</span>
              </div>
              <div className="flex justify-between text-pink-600">
                <span>Platform Fee</span>
                <span>− {formatIndianCurrency(commission.platformFee)}</span>
              </div>
              <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between font-semibold">
                <span className="text-gray-900">Vendor Receives</span>
                <span className="text-green-600">{formatIndianCurrency(commission.vendorPayout)}</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Commission tier: <span className="capitalize font-medium">{commission.tier}</span>
              </div>
            </div>
          )}
        </div>

        {/* Payment Information */}
        <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-blue-900">
              <p className="font-medium">Secure Payment via Razorpay</p>
              <p className="text-blue-700 mt-1">
                Your payment is processed securely. The vendor will receive their payout (after commission deduction) within 48-72 hours.
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-100">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Pay Button */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={handlePayment}
            disabled={loading || !razorpayLoaded}
            className={`
              w-full py-4 px-6 rounded-lg font-semibold text-lg
              transition-all duration-200 transform
              ${
                loading || !razorpayLoaded
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-600 to-purple-800 text-white hover:from-pink-700 hover:to-purple-900 hover:shadow-lg active:scale-95'
              }
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </span>
            ) : !razorpayLoaded ? (
              'Loading Payment System...'
            ) : (
              `Pay ${formatIndianCurrency(amount)}`
            )}
          </button>

          {/* Secure Payment Badge */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Secure Payment</span>
            </div>
            <span>•</span>
            <span>PCI DSS Compliant</span>
            <span>•</span>
            <span>256-bit SSL</span>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 mb-2">Accepted Payment Methods</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="px-3 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700">
            Credit Card
          </span>
          <span className="px-3 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700">
            Debit Card
          </span>
          <span className="px-3 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700">
            UPI
          </span>
          <span className="px-3 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700">
            Net Banking
          </span>
          <span className="px-3 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700">
            Wallets
          </span>
        </div>
      </div>
    </div>
  );
}
