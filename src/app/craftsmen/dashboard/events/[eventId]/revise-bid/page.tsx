'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../../../contexts/AuthContext';
import {
  ClockIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../../../../../../components/ui/LoadingSpinner';
import { useToast } from '../../../../../../components/ui/Toast';

interface BidItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface OriginalBid {
  bidId: string;
  items: BidItem[];
  subtotal: number;
  taxes: number;
  total: number;
  notes: string;
}

interface RevisionData {
  eventId: string;
  eventTitle: string;
  originalBid: OriginalBid;
  competitivePosition: {
    isLowestBid: boolean;
    percentageAbove: number;
    message: string;
  };
  revisionDeadline: string;
  canRevise: boolean;
  floorPrice: number;
}

export default function BidRevisionPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const eventId = params.eventId as string;
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revisionData, setRevisionData] = useState<RevisionData | null>(null);

  // Revised bid state
  const [revisedItems, setRevisedItems] = useState<BidItem[]>([]);
  const [revisedNotes, setRevisedNotes] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadRevisionData();
  }, [isAuthenticated, eventId]);

  const loadRevisionData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/craftsmen/events/${eventId}/revision-data`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load revision data');
      }

      const data = await response.json();
      setRevisionData(data);

      // Initialize revised items with original bid
      setRevisedItems(data.originalBid.items.map((item: BidItem) => ({ ...item })));
      setRevisedNotes(data.originalBid.notes || '');
    } catch (err) {
      console.error('Error loading revision data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load revision data');
    } finally {
      setLoading(false);
    }
  };

  const calculateRevisedTotal = () => {
    const subtotal = revisedItems.reduce((sum, item) => sum + item.total, 0);
    const taxes = Math.round(subtotal * 0.18); // 18% GST
    const total = subtotal + taxes;
    return { subtotal, taxes, total };
  };

  const updateItem = (index: number, field: keyof BidItem, value: number | string) => {
    const newItems = [...revisedItems];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate total for this item
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    }

    setRevisedItems(newItems);
  };

  const handleSubmitRevision = async () => {
    if (!revisionData?.canRevise) {
      displayToast('Revision window has closed', 'error');
      return;
    }

    const { total } = calculateRevisedTotal();

    // Validate that bid has actually changed
    if (total === revisionData.originalBid.total && revisedNotes === revisionData.originalBid.notes) {
      displayToast('Please make changes to your bid before submitting', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`/api/craftsmen/events/${eventId}/revise-bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidId: revisionData.originalBid.bidId,
          revisedItems,
          revisedNotes,
          revisedTotal: total
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit revision');
      }

      displayToast('Bid revision submitted successfully!', 'success');

      setTimeout(() => {
        router.push('/craftsmen/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error submitting revision:', err);
      displayToast(err instanceof Error ? err.message : 'Failed to submit revision', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const displayToast = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      toast.showSuccess(message);
    } else {
      toast.showError(message);
    }
  };

  const calculateTimeRemaining = () => {
    if (!revisionData?.revisionDeadline) return null;

    const deadline = new Date(revisionData.revisionDeadline);
    const now = new Date();
    const hoursRemaining = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)));

    return hoursRemaining;
  };

  const calculateSavingsVsOriginal = () => {
    const { total: revisedTotal } = calculateRevisedTotal();
    const originalTotal = revisionData?.originalBid.total || 0;
    const savings = originalTotal - revisedTotal;
    const savingsPercent = originalTotal > 0 ? Math.round((savings / originalTotal) * 100) : 0;
    return { savings, savingsPercent };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !revisionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-6">
        <div className="bg-red-900/20 border-2 border-red-500/50 rounded-xl p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
          <p className="text-slate-300">{error || 'Failed to load revision data'}</p>
          <button
            onClick={() => router.push('/craftsmen/dashboard')}
            className="mt-4 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const hoursRemaining = calculateTimeRemaining();
  const deadlinePassed = hoursRemaining !== null && hoursRemaining <= 0;
  const { subtotal: revisedSubtotal, taxes: revisedTaxes, total: revisedTotal } = calculateRevisedTotal();
  const { savings, savingsPercent } = calculateSavingsVsOriginal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/craftsmen/dashboard/events/${eventId}/shortlist`)}
          className="mb-6 flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Shortlist Details
        </button>

        {/* Header */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Revise Your Bid</h1>
          <p className="text-slate-300">{revisionData.eventTitle}</p>
        </div>

        {/* Deadline Warning */}
        {!deadlinePassed && hoursRemaining !== null && (
          <div className={`border-2 rounded-xl p-4 mb-6 ${
            hoursRemaining <= 6
              ? 'bg-red-900/20 border-red-500/50'
              : 'bg-purple-900/20 border-purple-500/30'
          }`}>
            <div className="flex items-center gap-3">
              <ClockIcon className={`w-6 h-6 ${hoursRemaining <= 6 ? 'text-red-400' : 'text-purple-400'}`} />
              <div>
                <p className={`font-semibold ${hoursRemaining <= 6 ? 'text-red-300' : 'text-purple-300'}`}>
                  {hoursRemaining} hours remaining to submit your revision
                </p>
                <p className="text-sm text-slate-400">
                  Deadline: {new Date(revisionData.revisionDeadline).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {deadlinePassed && (
          <div className="bg-red-900/20 border-2 border-red-500/50 rounded-xl p-6 mb-6">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
              <p className="text-red-300 font-semibold">
                Revision window has closed. Your original bid stands.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Bid (Read-only) */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Original Bid</h2>

            {/* Competitive Position */}
            <div className={`border rounded-lg p-4 mb-4 ${
              revisionData.competitivePosition.isLowestBid
                ? 'bg-orange-900/20 border-orange-500/30'
                : 'bg-blue-900/20 border-blue-500/30'
            }`}>
              <p className={`text-sm font-semibold ${
                revisionData.competitivePosition.isLowestBid ? 'text-orange-300' : 'text-blue-300'
              }`}>
                {revisionData.competitivePosition.message}
              </p>
            </div>

            {/* Original Items */}
            <div className="space-y-3 mb-4">
              {revisionData.originalBid.items.map((item, idx) => (
                <div key={idx} className="bg-slate-700/30 rounded-lg p-3">
                  <p className="text-white font-medium mb-1">{item.description}</p>
                  <div className="text-sm text-slate-400 space-y-1">
                    <p>Quantity: {item.quantity}</p>
                    <p>Unit Price: ₹{item.unitPrice.toLocaleString('en-IN')}</p>
                    <p className="font-semibold text-white">Total: ₹{item.total.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Original Totals */}
            <div className="border-t border-slate-600 pt-4 space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal:</span>
                <span>₹{revisionData.originalBid.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Taxes (18%):</span>
                <span>₹{revisionData.originalBid.taxes.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-slate-600">
                <span>Total:</span>
                <span>₹{revisionData.originalBid.total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {revisionData.originalBid.notes && (
              <div className="mt-4 pt-4 border-t border-slate-600">
                <p className="text-slate-400 text-sm mb-1">Original Notes:</p>
                <p className="text-slate-300 text-sm">{revisionData.originalBid.notes}</p>
              </div>
            )}
          </div>

          {/* Revised Bid (Editable) */}
          <div className="bg-gradient-to-br from-orange-900/20 to-pink-900/20 border-2 border-orange-500/30 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-orange-400" />
              Revised Bid
            </h2>

            {/* Revised Items */}
            <div className="space-y-4 mb-4">
              {revisedItems.map((item, idx) => (
                <div key={idx} className="bg-slate-800/50 rounded-lg p-4">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    disabled={deadlinePassed}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white mb-3 disabled:opacity-50"
                    placeholder="Item description"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 text-xs mb-1 block">Quantity</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                        disabled={deadlinePassed}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white disabled:opacity-50"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-xs mb-1 block">Unit Price (₹)</label>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(idx, 'unitPrice', parseInt(e.target.value) || 0)}
                        disabled={deadlinePassed}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white disabled:opacity-50"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-right">
                    <span className="text-slate-400 text-sm">Item Total: </span>
                    <span className="text-white font-semibold">₹{item.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Revised Notes */}
            <div className="mb-4">
              <label className="text-slate-400 text-sm mb-2 block">Revision Notes</label>
              <textarea
                value={revisedNotes}
                onChange={(e) => setRevisedNotes(e.target.value)}
                disabled={deadlinePassed}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white disabled:opacity-50"
                rows={3}
                placeholder="Explain changes to your bid..."
              />
            </div>

            {/* Revised Totals */}
            <div className="border-t border-orange-500/30 pt-4 space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal:</span>
                <span>₹{revisedSubtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Taxes (18%):</span>
                <span>₹{revisedTaxes.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-orange-500/30">
                <span>New Total:</span>
                <span>₹{revisedTotal.toLocaleString('en-IN')}</span>
              </div>

              {/* Savings Indicator */}
              {savings !== 0 && (
                <div className={`mt-3 p-3 rounded-lg ${
                  savings > 0
                    ? 'bg-emerald-900/30 border border-emerald-500/30'
                    : 'bg-red-900/30 border border-red-500/30'
                }`}>
                  <p className={`text-sm font-semibold ${savings > 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                    {savings > 0 ? '↓' : '↑'} {Math.abs(savingsPercent)}% {savings > 0 ? 'lower' : 'higher'} than original
                    <span className="block text-xs mt-1">
                      {savings > 0 ? 'Savings' : 'Increase'}: ₹{Math.abs(savings).toLocaleString('en-IN')}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        {!deadlinePassed && (
          <div className="mt-6 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <button
              onClick={handleSubmitRevision}
              disabled={submitting || deadlinePassed}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-4 rounded-lg transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner />
                  Submitting Revision...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircleIcon className="w-6 h-6" />
                  Submit Revised Bid
                </span>
              )}
            </button>
            <p className="text-center text-slate-400 text-sm mt-3">
              You can only submit one revision. Make sure your changes are final.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
