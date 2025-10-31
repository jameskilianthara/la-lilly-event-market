'use client';

/**
 * PaymentMethodSelector Component
 * Allows users to choose between online (Razorpay) and cash payment methods
 * Shows commission rate differences
 */

import React from 'react';
import { COMMISSION_RATES, PLATFORM_FEES, determineCommissionTier } from '@/lib/promotions';
import { formatIndianCurrency } from '@/lib/commission';

interface PaymentMethodSelectorProps {
  projectValue: number;
  selectedMethod: 'online' | 'cash';
  onMethodChange: (method: 'online' | 'cash') => void;
  disabled?: boolean;
}

export default function PaymentMethodSelector({
  projectValue,
  selectedMethod,
  onMethodChange,
  disabled = false,
}: PaymentMethodSelectorProps) {
  const tier = determineCommissionTier(projectValue);

  const onlineRate = COMMISSION_RATES.online[tier];
  const cashRate = COMMISSION_RATES.cash[tier];
  const savingsPercentage = ((onlineRate - cashRate) / onlineRate * 100).toFixed(0);

  const onlineCommission = (projectValue * onlineRate) / 100;
  const cashCommission = (projectValue * cashRate) / 100;
  const commissionSavings = onlineCommission - cashCommission;

  const onlinePlatformFee = PLATFORM_FEES.online;
  const cashPlatformFee = projectValue <= 100000 ? PLATFORM_FEES.cash.small : PLATFORM_FEES.cash.large;

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-gray-900 mb-3">
        Payment Method
      </label>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Online Payment Option */}
        <button
          onClick={() => !disabled && onMethodChange('online')}
          disabled={disabled}
          className={`
            relative p-6 rounded-xl border-2 text-left transition-all duration-200
            ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:shadow-lg'}
            ${
              selectedMethod === 'online'
                ? 'border-pink-600 bg-pink-50 ring-4 ring-pink-100'
                : 'border-gray-300 bg-white hover:border-pink-400'
            }
          `}
        >
          {/* Selected Indicator */}
          {selectedMethod === 'online' && (
            <div className="absolute top-4 right-4 w-6 h-6 bg-pink-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}

          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Online Payment</h3>
              <p className="text-sm text-gray-600">Instant via Razorpay</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Commission Rate:</span>
              <span className="font-bold text-gray-900">{onlineRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Commission Amount:</span>
              <span className="font-bold text-gray-900">{formatIndianCurrency(onlineCommission)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Platform Fee:</span>
              <span className="font-bold text-gray-900">{formatIndianCurrency(onlinePlatformFee)}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Instant payment confirmation</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-700 mt-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>All payment methods supported</span>
            </div>
          </div>
        </button>

        {/* Cash Payment Option */}
        <button
          onClick={() => !disabled && onMethodChange('cash')}
          disabled={disabled}
          className={`
            relative p-6 rounded-xl border-2 text-left transition-all duration-200
            ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:shadow-lg'}
            ${
              selectedMethod === 'cash'
                ? 'border-green-600 bg-green-50 ring-4 ring-green-100'
                : 'border-gray-300 bg-white hover:border-green-400'
            }
          `}
        >
          {/* Selected Indicator */}
          {selectedMethod === 'cash' && (
            <div className="absolute top-4 right-4 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}

          {/* Savings Badge */}
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-600 text-white">
              Save {savingsPercentage}%
            </span>
          </div>

          <div className="flex items-start gap-3 mb-4 mt-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Cash Payment</h3>
              <p className="text-sm text-gray-600">Direct to vendor</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Commission Rate:</span>
              <span className="font-bold text-green-700">
                {cashRate}% <span className="text-xs text-green-600">(was {onlineRate}%)</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Commission Amount:</span>
              <span className="font-bold text-gray-900">{formatIndianCurrency(cashCommission)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Platform Fee:</span>
              <span className="font-bold text-gray-900">{formatIndianCurrency(cashPlatformFee)}</span>
            </div>
            <div className="pt-2 border-t border-green-300 bg-green-100 -mx-2 px-2 py-2 rounded">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-green-900">Your Savings:</span>
                <span className="font-bold text-green-700">{formatIndianCurrency(commissionSavings)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Payment confirmation required</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 mt-1">
              <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Commission invoice after project completion</span>
            </div>
          </div>
        </button>
      </div>

      {/* Information Box */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1 text-sm text-blue-900">
            <p className="font-semibold mb-1">How it works:</p>
            {selectedMethod === 'online' ? (
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Pay the full project amount securely via Razorpay</li>
                <li>Vendor receives payment (minus commission) within 48-72 hours</li>
                <li>Platform commission is automatically deducted</li>
              </ul>
            ) : (
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Pay vendor directly in cash after project completion</li>
                <li>Both parties confirm payment on platform</li>
                <li>Vendor pays reduced commission to platform via invoice (15 days)</li>
                <li>Lower commission rate as incentive for cash transactions</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
