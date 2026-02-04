import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  try {
    const { contractId } = await params;
    const body = await request.json();
    const { signerId, signerRole, fullName, email } = body;

    if (!signerId || !signerRole || !fullName || !email) {
      return NextResponse.json(
        { error: 'Missing required signature information' },
        { status: 400 }
      );
    }

    if (signerRole !== 'client' && signerRole !== 'vendor') {
      return NextResponse.json(
        { error: 'Invalid signer role' },
        { status: 400 }
      );
    }

    // Fetch contract
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (fetchError || !contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Verify signer identity
    if (signerRole === 'client' && contract.client_id !== signerId) {
      return NextResponse.json(
        { error: 'You are not authorized to sign this contract as client' },
        { status: 403 }
      );
    }

    if (signerRole === 'vendor') {
      // For vendor, need to check vendor table mapping
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', signerId)
        .single();

      if (!vendorData || vendorData.id !== contract.vendor_id) {
        return NextResponse.json(
          { error: 'You are not authorized to sign this contract as vendor' },
          { status: 403 }
        );
      }
    }

    // Check if already signed
    const existingSignatures = contract.signatures_json || {};
    if (existingSignatures[signerRole]?.signed_at) {
      return NextResponse.json(
        { error: `${signerRole} has already signed this contract` },
        { status: 400 }
      );
    }

    // For vendor signature, client must sign first
    if (signerRole === 'vendor' && !existingSignatures.client?.signed_at) {
      return NextResponse.json(
        { error: 'Client must sign the contract first' },
        { status: 400 }
      );
    }

    // Create signature record
    const signatureTimestamp = new Date().toISOString();
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    const updatedSignatures = {
      ...existingSignatures,
      [signerRole]: {
        signer_id: signerId,
        full_name: fullName,
        email: email,
        signed_at: signatureTimestamp,
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    };

    // Determine new contract status
    let newStatus = contract.contract_status;
    let signedAt = contract.signed_at;

    // If both parties have now signed, update to SIGNED status
    if (updatedSignatures.client?.signed_at && updatedSignatures.vendor?.signed_at) {
      newStatus = 'SIGNED';
      signedAt = signatureTimestamp;
    }

    // Update contract with signature
    const { data: updatedContract, error: updateError } = await supabase
      .from('contracts')
      .update({
        signatures_json: updatedSignatures,
        contract_status: newStatus,
        signed_at: signedAt
      })
      .eq('id', contractId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating contract:', updateError);
      return NextResponse.json(
        { error: 'Failed to save signature' },
        { status: 500 }
      );
    }

    // If contract is now fully signed, update event status to ACTIVE
    if (newStatus === 'SIGNED') {
      await supabase
        .from('events')
        .update({ forge_status: 'IN_FORGE' })
        .eq('id', contract.event_id);
    }

    return NextResponse.json({
      success: true,
      contract: updatedContract,
      message: newStatus === 'SIGNED'
        ? 'Contract fully signed! Work can now begin.'
        : 'Signature recorded successfully. Waiting for other party to sign.'
    });
  } catch (error) {
    console.error('Error signing contract:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
