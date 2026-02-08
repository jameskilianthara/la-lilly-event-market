'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import type { Contract, User } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface ContractPageProps {
  params: Promise<{ contractId: string }>;
}

export default function ContractPage({ params }: ContractPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const [contract, setContract] = useState<Contract | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [signatureDate, setSignatureDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadContract() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Fetch user profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        setCurrentUser(profile);
        setSignatureName(profile?.full_name || '');

        // Fetch contract
        const { data: contractData, error: contractError } = await supabase
          .from('contracts')
          .select('*')
          .eq('id', resolvedParams.contractId)
          .single();

        if (contractError) {
          setError('Contract not found');
          setLoading(false);
          return;
        }

        // Verify user has access (must be client or vendor)
        if (contractData.client_id !== user.id && contractData.vendor_id !== profile?.id) {
          setError('You do not have permission to view this contract');
          setLoading(false);
          return;
        }

        setContract(contractData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading contract:', err);
        setError('Failed to load contract');
        setLoading(false);
      }
    }

    loadContract();
  }, [resolvedParams.contractId, router, supabase]);

  const handleSign = async () => {
    if (!contract || !currentUser || !signatureName) {
      setError('Please enter your full name to sign');
      return;
    }

    setSigning(true);
    setError(null);

    try {
      const isClient = contract.client_id === currentUser.id;
      const isVendor = contract.vendor_id === currentUser.id;

      if (!isClient && !isVendor) {
        setError('You are not authorized to sign this contract');
        setSigning(false);
        return;
      }

      // Get existing signatures
      const existingSignatures = contract.signatures_json || {};

      // Add new signature
      const newSignature = {
        name: signatureName,
        date: signatureDate,
        timestamp: new Date().toISOString(),
        ipAddress: 'client' // In production, get from server
      };

      const updatedSignatures = {
        ...existingSignatures,
        [isClient ? 'client' : 'vendor']: newSignature
      };

      // Check if both parties have signed
      const bothSigned = updatedSignatures.client && updatedSignatures.vendor;
      const newStatus = bothSigned ? 'SIGNED' : 'PENDING';

      // Update contract
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          signatures_json: updatedSignatures,
          contract_status: newStatus,
          signed_at: bothSigned ? new Date().toISOString() : null
        })
        .eq('id', contract.id);

      if (updateError) {
        throw updateError;
      }

      // Reload contract
      const { data: updatedContract } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contract.id)
        .single();

      setContract(updatedContract);
      setSigning(false);

      // Show success message
      alert(bothSigned ? 'Contract fully executed!' : 'Contract signed successfully. Waiting for other party to sign.');

    } catch (err) {
      console.error('Error signing contract:', err);
      setError('Failed to sign contract. Please try again.');
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contract...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contract Not Found</h2>
          <p className="text-gray-600 mb-8">{error || 'Unable to load contract'}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const contractJSON = contract.contract_json;
  const signatures = contract.signatures_json || {};
  const isClient = contract.client_id === currentUser?.id;
  const isVendor = contract.vendor_id === currentUser?.id;
  const userHasSigned = isClient ? signatures.client : signatures.vendor;
  const otherPartySigned = isClient ? signatures.vendor : signatures.client;
  const bothSigned = signatures.client && signatures.vendor;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-700 text-white rounded-t-lg p-8">
          <h1 className="text-3xl font-bold mb-2">EventFoundry Contract</h1>
          <p className="text-pink-100">Contract ID: {contract.id}</p>
        </div>

        {/* Contract Content */}
        <div className="bg-white shadow-lg rounded-b-lg p-8">
          {/* PDF Download */}
          {contract.pdf_url && (
            <div className="mb-6 text-center">
              <a
                href={contract.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Full Contract PDF
              </a>
            </div>
          )}

          {/* Status Badge */}
          <div className="mb-6">
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
              contract.contract_status === 'SIGNED' ? 'bg-green-100 text-green-800' :
              contract.contract_status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              Status: {contract.contract_status}
            </span>
          </div>

          {/* Contract Details */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Parties</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Client</h3>
                  <p className="text-gray-900">{contractJSON.clientName}</p>
                  <p className="text-sm text-gray-600">{contractJSON.clientEmail}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Vendor</h3>
                  <p className="text-gray-900">{contractJSON.vendorName}</p>
                  <p className="text-sm text-gray-600">{contractJSON.vendorEmail}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Event Details</h2>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p><span className="font-semibold">Event:</span> {contractJSON.eventTitle}</p>
                <p><span className="font-semibold">Type:</span> {contractJSON.eventType}</p>
                {contractJSON.eventDate && (
                  <p><span className="font-semibold">Date:</span> {new Date(contractJSON.eventDate).toLocaleDateString('en-IN')}</p>
                )}
                {contractJSON.eventLocation && (
                  <p><span className="font-semibold">Location:</span> {contractJSON.eventLocation}</p>
                )}
                {contractJSON.guestCount && (
                  <p><span className="font-semibold">Guests:</span> {contractJSON.guestCount}</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Financial Terms</h2>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p><span className="font-semibold">Subtotal:</span> ₹{contractJSON.subtotal?.toLocaleString('en-IN')}</p>
                <p><span className="font-semibold">Taxes:</span> ₹{contractJSON.taxes?.toLocaleString('en-IN')}</p>
                <p className="text-lg font-bold"><span>Total:</span> ₹{contractJSON.totalAmount?.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Payment Milestones */}
            {contractJSON.milestones && contractJSON.milestones.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Schedule</h2>
                <div className="space-y-3">
                  {contractJSON.milestones.map((milestone: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{milestone.name}</h3>
                          <p className="text-sm text-gray-600">{milestone.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">₹{milestone.amount.toLocaleString('en-IN')}</p>
                          <p className="text-sm text-gray-600">{milestone.percentage}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Signature Section */}
            <div className="border-t-2 border-gray-200 pt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Signatures</h2>

              {/* Existing Signatures */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Client Signature</h3>
                  {signatures.client ? (
                    <div>
                      <p className="font-medium text-gray-900">{signatures.client.name}</p>
                      <p className="text-sm text-gray-600">
                        Signed: {new Date(signatures.client.date).toLocaleDateString('en-IN')}
                      </p>
                      <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        ✓ Signed
                      </span>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Pending signature</p>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Vendor Signature</h3>
                  {signatures.vendor ? (
                    <div>
                      <p className="font-medium text-gray-900">{signatures.vendor.name}</p>
                      <p className="text-sm text-gray-600">
                        Signed: {new Date(signatures.vendor.date).toLocaleDateString('en-IN')}
                      </p>
                      <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        ✓ Signed
                      </span>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Pending signature</p>
                  )}
                </div>
              </div>

              {/* Sign Contract Form */}
              {!userHasSigned && !bothSigned && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Sign Contract</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name (Type to sign)
                      </label>
                      <input
                        type="text"
                        value={signatureName}
                        onChange={(e) => setSignatureName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="Enter your full legal name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date
                      </label>
                      <input
                        type="date"
                        value={signatureDate}
                        onChange={(e) => setSignatureDate(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Legal Notice:</strong> By typing your name and clicking "Sign Contract",
                        you agree to be bound by all terms and conditions stated in this contract.
                        This electronic signature has the same legal effect as a handwritten signature.
                      </p>
                    </div>
                    <button
                      onClick={handleSign}
                      disabled={signing || !signatureName}
                      className="w-full px-6 py-3 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                    >
                      {signing ? 'Signing...' : 'Sign Contract'}
                    </button>
                  </div>
                </div>
              )}

              {/* Status Messages */}
              {userHasSigned && !bothSigned && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800">
                    ✓ You have signed this contract. Waiting for {isClient ? 'vendor' : 'client'} to sign.
                  </p>
                </div>
              )}

              {bothSigned && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-semibold">
                    ✓ Contract fully executed! Both parties have signed.
                  </p>
                  {contract.signed_at && (
                    <p className="text-sm text-green-700 mt-1">
                      Completed on: {new Date(contract.signed_at).toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 underline"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
