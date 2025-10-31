'use client';

/**
 * PromoCodeInput Component
 * Allows users to enter and validate promo codes with real-time feedback
 */

import React, { useState } from 'react';
import { formatIndianCurrency } from '@/lib/commission';

interface PromoCodeInputProps {
  projectValue: number;
  paymentMethod: 'online' | 'cash';
  eventType?: string;
  userId: string;
  onPromoApplied?: (promoData: any) => void;
  onPromoRemoved?: () => void;
  disabled?: boolean;
}

export default function PromoCodeInput({
  projectValue,
  paymentMethod,
  eventType,
  userId,
  onPromoApplied,
  onPromoRemoved,
  disabled = false,
}: PromoCodeInputProps) {
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discount, setDiscount] = useState<any>(null);

  // =====================================================
  // VALIDATE PROMO CODE
  // =====================================================

  const validatePromo = async () => {
    if (!promoCode.trim()) {
      setError('Please enter a promo code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promoCode: promoCode.toUpperCase(),
          userId,
          projectValue,
          paymentMethod,
          eventType,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Invalid promo code');
        setApplied(false);
        setDiscount(null);
      } else {
        setApplied(true);
        setDiscount(result.data.discount);
        setError(null);

        if (onPromoApplied) {
          onPromoApplied(result.data);
        }
      }
    } catch (err) {
      setError('Failed to validate promo code');
      setApplied(false);
      setDiscount(null);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // REMOVE PROMO CODE
  // =====================================================

  const removePromo = () => {
    setPromoCode('');
    setApplied(false);
    setDiscount(null);
    setError(null);

    if (onPromoRemoved) {
      onPromoRemoved();
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="w-full">
      {/* Input Section */}
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={promoCode}
            onChange={e => setPromoCode(e.target.value.toUpperCase())}
            onKeyPress={e => e.key === 'Enter' && validatePromo()}
            placeholder="Enter promo code"
            disabled={disabled || applied}
            className={`
              w-full px-4 py-3 rounded-lg border-2 font-mono uppercase
              transition-all duration-200
              ${
                applied
                  ? 'border-green-500 bg-green-50 text-green-900'
                  : error
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 bg-white hover:border-pink-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-200'
              }
              ${disabled || applied ? 'cursor-not-allowed' : ''}
              outline-none
            `}
          />
        </div>

        {!applied ? (
          <button
            onClick={validatePromo}
            disabled={disabled || loading || !promoCode.trim()}
            className={`
              px-6 py-3 rounded-lg font-semibold transition-all duration-200
              ${
                disabled || loading || !promoCode.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-600 to-purple-800 text-white hover:from-pink-700 hover:to-purple-900 hover:shadow-lg active:scale-95'
              }
            `}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Applying...</span>
              </span>
            ) : (
              'Apply'
            )}
          </button>
        ) : (
          <button
            onClick={removePromo}
            disabled={disabled}
            className="px-6 py-3 rounded-lg font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-all duration-200"
          >
            Remove
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Success Message with Discount Details */}
      {applied && discount && (
        <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <div className="flex-1">
              <h4 className="font-bold text-green-900 mb-1">Promo Code Applied!</h4>
              <p className="text-sm text-green-800 mb-3">
                Code: <span className="font-mono font-bold">{promoCode}</span>
              </p>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-green-700">Original Commission:</p>
                  <p className="font-bold text-green-900">{formatIndianCurrency(discount.originalCommission)}</p>
                </div>
                <div>
                  <p className="text-green-700">Your Savings:</p>
                  <p className="font-bold text-green-900">
                    {formatIndianCurrency(discount.amount)} ({discount.savingsPercentage}% off)
                  </p>
                </div>
                <div className="col-span-2 pt-2 border-t border-green-300">
                  <p className="text-green-700">Final Commission:</p>
                  <p className="font-bold text-green-900 text-lg">{formatIndianCurrency(discount.finalCommission)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      {!applied && !error && (
        <p className="mt-2 text-xs text-gray-500">
          Have a promo code? Enter it above to get discounts on platform commission
        </p>
      )}
    </div>
  );
}
