import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  generateContractJSON,
  generateContractPDF,
  uploadContractPDF,
  type ContractData
} from '@/lib/contractGenerator';
import type { Event, Bid, User, Vendor } from '@/types/database';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { eventId, bidId } = await request.json();

    if (!eventId || !bidId) {
      return NextResponse.json(
        { error: 'Event ID and Bid ID are required' },
        { status: 400 }
      );
    }

    // Fetch event with client details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      console.error('Event fetch error:', eventError);
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Fetch bid details
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .select('*')
      .eq('id', bidId)
      .eq('event_id', eventId)
      .single();

    if (bidError || !bid) {
      console.error('Bid fetch error:', bidError);
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
    }

    // Security: Verify bid is accepted before generating contract
    if (bid.status !== 'ACCEPTED') {
      return NextResponse.json(
        { error: 'Bid must be accepted before generating contract' },
        { status: 400 }
      );
    }

    // Security: Check if contract already exists for this bid
    const { data: existingContract } = await supabase
      .from('contracts')
      .select('id')
      .eq('bid_id', bidId)
      .single();

    if (existingContract) {
      return NextResponse.json(
        { error: 'Contract already exists for this bid', contractId: existingContract.id },
        { status: 409 }
      );
    }

    // Fetch client user details
    const { data: client, error: clientError } = await supabase
      .from('users')
      .select('*')
      .eq('id', event.owner_user_id)
      .single();

    if (clientError || !client) {
      console.error('Client fetch error:', clientError);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Fetch vendor details with user info
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*, users!vendors_user_id_fkey(*)')
      .eq('id', bid.vendor_id)
      .single();

    if (vendorError || !vendor) {
      console.error('Vendor fetch error:', vendorError);
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Generate contract ID
    const contractId = `CNT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Prepare contract data
    const contractData: ContractData = {
      event: event as Event,
      bid: bid as Bid,
      client: client as User,
      vendor: {
        ...(vendor as Vendor),
        user: Array.isArray(vendor.users) ? vendor.users[0] : vendor.users
      },
      contractId
    };

    // Generate contract JSON
    const contractJSON = generateContractJSON(contractData);

    // Generate PDF
    const pdfBlob = generateContractPDF(contractJSON);

    // Upload PDF to Supabase storage
    const pdfUrl = await uploadContractPDF(contractId, pdfBlob, supabase);

    if (!pdfUrl) {
      console.error('Failed to upload contract PDF');
      return NextResponse.json(
        { error: 'Failed to upload contract PDF' },
        { status: 500 }
      );
    }

    // Create contract record in database
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .insert({
        id: contractId,
        event_id: eventId,
        bid_id: bidId,
        vendor_id: bid.vendor_id,
        client_id: event.owner_user_id,
        contract_json: contractJSON,
        pdf_url: pdfUrl,
        total_amount: bid.total_forge_cost,
        deposit_amount: contractJSON.depositAmount,
        milestones: contractJSON.milestones,
        contract_status: 'PENDING',
        signatures_json: {}
      })
      .select()
      .single();

    if (contractError) {
      console.error('Contract creation error:', contractError);
      return NextResponse.json(
        { error: 'Failed to create contract record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      contract: {
        id: contractId,
        pdfUrl,
        totalAmount: bid.total_forge_cost,
        depositAmount: contractJSON.depositAmount,
        status: 'PENDING'
      }
    });
  } catch (error) {
    console.error('Error generating contract:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
