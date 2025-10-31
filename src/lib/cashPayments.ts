/**
 * Cash Payment Handling for EventFoundry
 *
 * Manages cash payment workflows, commission invoicing,
 * and payment confirmation processes.
 */

import { supabase } from '../../lib/supabase';
import { calculateCommissionWithPromo, formatIndianCurrency, type CommissionWithPromo } from './promotions';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface CommissionInvoice {
  id: string;
  contract_id: string;
  vendor_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;

  // Amounts
  project_value: number;
  base_commission: number;
  promo_discount: number;
  commission_after_discount: number;
  gst_amount: number;
  platform_fee: number;
  total_amount: number;

  // Payment tracking
  status: 'PENDING' | 'SENT' | 'OVERDUE' | 'PAID' | 'CANCELLED';
  payment_method?: string;
  payment_reference?: string;
  paid_at?: string;

  // Documents
  pdf_url?: string;

  created_at: string;
  updated_at: string;
}

export interface CashPaymentConfirmation {
  contractId: string;
  confirmedBy: 'client' | 'vendor';
  confirmationNotes?: string;
  paymentDate?: string;
  paymentAmount?: number;
}

// =====================================================
// COMMISSION INVOICE GENERATION
// =====================================================

/**
 * Generates commission invoice for cash payment contract
 */
export async function generateCommissionInvoice(
  contractId: string,
  commissionData: CommissionWithPromo
): Promise<{ success: boolean; invoice?: CommissionInvoice; error?: string }> {
  try {
    // Fetch contract and vendor details
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(
        `
        *,
        bids (
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

    if (contractError || !contract) {
      return { success: false, error: 'Contract not found' };
    }

    if (contract.payment_method !== 'cash') {
      return { success: false, error: 'Invoice generation only for cash payments' };
    }

    // Check if invoice already exists
    const { data: existingInvoice } = await supabase
      .from('commission_invoices')
      .select('*')
      .eq('contract_id', contractId)
      .single();

    if (existingInvoice) {
      return { success: true, invoice: existingInvoice as CommissionInvoice };
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Calculate due date (15 days from invoice date)
    const invoiceDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('commission_invoices')
      .insert({
        contract_id: contractId,
        vendor_id: contract.bids.vendors.id,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        project_value: commissionData.projectValue,
        base_commission: commissionData.baseCommission,
        promo_discount: commissionData.promoDiscount,
        commission_after_discount: commissionData.finalCommission,
        gst_amount: commissionData.gstAmount,
        platform_fee: commissionData.platformFee,
        total_amount: commissionData.totalCommission,
        status: 'PENDING',
      })
      .select()
      .single();

    if (invoiceError || !invoice) {
      return { success: false, error: 'Failed to create invoice' };
    }

    // Update contract with invoice timestamp
    await supabase
      .from('contracts')
      .update({ commission_invoice_sent_at: new Date().toISOString() })
      .eq('id', contractId);

    return { success: true, invoice: invoice as CommissionInvoice };
  } catch (error) {
    console.error('Error generating commission invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generates unique invoice number
 */
async function generateInvoiceNumber(): Promise<string> {
  try {
    // Try to use database function if available
    const { data, error } = await supabase.rpc('generate_invoice_number');

    if (!error && data) {
      return data;
    }

    // Fallback: generate client-side
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    // Get count of invoices this month
    const { data: invoices } = await supabase
      .from('commission_invoices')
      .select('invoice_number')
      .like('invoice_number', `EF-${year}${month}-%`)
      .order('invoice_number', { ascending: false })
      .limit(1);

    let sequence = 1;
    if (invoices && invoices.length > 0) {
      const lastNumber = invoices[0].invoice_number;
      const lastSequence = parseInt(lastNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `EF-${year}${month}-${String(sequence).padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    // Fallback with timestamp
    return `EF-${Date.now()}`;
  }
}

// =====================================================
// CASH PAYMENT CONFIRMATION
// =====================================================

/**
 * Records cash payment confirmation from client or vendor
 */
export async function confirmCashPayment(
  confirmation: CashPaymentConfirmation
): Promise<{ success: boolean; bothConfirmed?: boolean; error?: string }> {
  try {
    const { contractId, confirmedBy, confirmationNotes, paymentDate, paymentAmount } = confirmation;

    // Fetch current contract state
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('*, commission_invoices(*)')
      .eq('id', contractId)
      .single();

    if (fetchError || !contract) {
      return { success: false, error: 'Contract not found' };
    }

    if (contract.payment_method !== 'cash') {
      return { success: false, error: 'This is not a cash payment contract' };
    }

    // Update appropriate confirmation field
    const updateData: any = {
      cash_payment_confirmed_at: new Date().toISOString(),
    };

    if (confirmedBy === 'client') {
      if (contract.cash_payment_confirmed_by_client) {
        return { success: false, error: 'Client has already confirmed payment' };
      }
      updateData.cash_payment_confirmed_by_client = true;
    } else {
      if (contract.cash_payment_confirmed_by_vendor) {
        return { success: false, error: 'Vendor has already confirmed payment' };
      }
      updateData.cash_payment_confirmed_by_vendor = true;
    }

    // Update contract
    const { error: updateError } = await supabase.from('contracts').update(updateData).eq('id', contractId);

    if (updateError) {
      return { success: false, error: 'Failed to record confirmation' };
    }

    // Check if both parties have confirmed
    const bothConfirmed =
      (confirmedBy === 'client' && contract.cash_payment_confirmed_by_vendor) ||
      (confirmedBy === 'vendor' && contract.cash_payment_confirmed_by_client);

    // If both confirmed, update invoice status
    if (bothConfirmed && contract.commission_invoices && contract.commission_invoices.length > 0) {
      await supabase
        .from('commission_invoices')
        .update({ status: 'SENT' })
        .eq('contract_id', contractId)
        .eq('status', 'PENDING');
    }

    return { success: true, bothConfirmed };
  } catch (error) {
    console.error('Error confirming cash payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Gets cash payment confirmation status
 */
export async function getCashPaymentStatus(
  contractId: string
): Promise<{
  success: boolean;
  status?: {
    clientConfirmed: boolean;
    vendorConfirmed: boolean;
    bothConfirmed: boolean;
    confirmedAt?: string;
  };
  error?: string;
}> {
  try {
    const { data: contract, error } = await supabase
      .from('contracts')
      .select('cash_payment_confirmed_by_client, cash_payment_confirmed_by_vendor, cash_payment_confirmed_at')
      .eq('id', contractId)
      .single();

    if (error || !contract) {
      return { success: false, error: 'Contract not found' };
    }

    const bothConfirmed = contract.cash_payment_confirmed_by_client && contract.cash_payment_confirmed_by_vendor;

    return {
      success: true,
      status: {
        clientConfirmed: contract.cash_payment_confirmed_by_client || false,
        vendorConfirmed: contract.cash_payment_confirmed_by_vendor || false,
        bothConfirmed,
        confirmedAt: bothConfirmed ? contract.cash_payment_confirmed_at : undefined,
      },
    };
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =====================================================
// COMMISSION PAYMENT (Vendor pays platform)
// =====================================================

/**
 * Records vendor commission payment to platform
 */
export async function recordCommissionPayment(
  invoiceId: string,
  paymentData: {
    paymentMethod: string;
    paymentReference: string;
    paidAmount: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { paymentMethod, paymentReference, paidAmount } = paymentData;

    // Fetch invoice
    const { data: invoice, error: fetchError } = await supabase
      .from('commission_invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (fetchError || !invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    if (invoice.status === 'PAID') {
      return { success: false, error: 'Invoice already paid' };
    }

    // Verify payment amount
    if (Math.abs(paidAmount - invoice.total_amount) > 1) {
      // Allow ₹1 tolerance for rounding
      return {
        success: false,
        error: `Payment amount mismatch. Expected ${formatIndianCurrency(invoice.total_amount)}`,
      };
    }

    // Update invoice
    const { error: updateError } = await supabase
      .from('commission_invoices')
      .update({
        status: 'PAID',
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        paid_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    if (updateError) {
      return { success: false, error: 'Failed to update invoice' };
    }

    // Update contract
    await supabase
      .from('contracts')
      .update({
        commission_paid_at: new Date().toISOString(),
        commission_payment_method: paymentMethod,
      })
      .eq('id', invoice.contract_id);

    return { success: true };
  } catch (error) {
    console.error('Error recording commission payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =====================================================
// INVOICE MANAGEMENT
// =====================================================

/**
 * Gets commission invoice by ID
 */
export async function getCommissionInvoice(
  invoiceId: string
): Promise<{ success: boolean; invoice?: CommissionInvoice; error?: string }> {
  try {
    const { data: invoice, error } = await supabase
      .from('commission_invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error || !invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    return { success: true, invoice: invoice as CommissionInvoice };
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Gets all invoices for a vendor
 */
export async function getVendorInvoices(
  vendorId: string
): Promise<{ success: boolean; invoices?: CommissionInvoice[]; error?: string }> {
  try {
    const { data: invoices, error } = await supabase
      .from('commission_invoices')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, invoices: invoices as CommissionInvoice[] };
  } catch (error) {
    console.error('Error fetching vendor invoices:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Gets overdue invoices
 */
export async function getOverdueInvoices(): Promise<{ success: boolean; invoices?: CommissionInvoice[]; error?: string }> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: invoices, error } = await supabase
      .from('commission_invoices')
      .select('*')
      .in('status', ['PENDING', 'SENT'])
      .lt('due_date', today)
      .order('due_date', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    // Mark as overdue
    if (invoices && invoices.length > 0) {
      const overdueIds = invoices.map(inv => inv.id);
      await supabase.from('commission_invoices').update({ status: 'OVERDUE' }).in('id', overdueIds);
    }

    return { success: true, invoices: invoices as CommissionInvoice[] };
  } catch (error) {
    console.error('Error fetching overdue invoices:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Checks if vendor has outstanding commission payments
 */
export async function hasOutstandingCommissions(
  vendorId: string
): Promise<{ hasOutstanding: boolean; overdueCount: number; overdueAmount: number }> {
  try {
    const { data: invoices } = await supabase
      .from('commission_invoices')
      .select('status, total_amount')
      .eq('vendor_id', vendorId)
      .in('status', ['OVERDUE', 'SENT']);

    const overdueInvoices = invoices?.filter(inv => inv.status === 'OVERDUE') || [];
    const overdueCount = overdueInvoices.length;
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

    return {
      hasOutstanding: overdueCount > 0,
      overdueCount,
      overdueAmount,
    };
  } catch (error) {
    console.error('Error checking outstanding commissions:', error);
    return {
      hasOutstanding: false,
      overdueCount: 0,
      overdueAmount: 0,
    };
  }
}

// =====================================================
// CASH PAYMENT WORKFLOW HELPERS
// =====================================================

/**
 * Gets complete cash payment workflow status for a contract
 */
export async function getCashPaymentWorkflowStatus(contractId: string) {
  try {
    const { data: contract, error } = await supabase
      .from('contracts')
      .select(
        `
        *,
        commission_invoices (*)
      `
      )
      .eq('id', contractId)
      .single();

    if (error || !contract) {
      return { success: false, error: 'Contract not found' };
    }

    if (contract.payment_method !== 'cash') {
      return { success: false, error: 'Not a cash payment contract' };
    }

    const invoice = contract.commission_invoices?.[0];

    return {
      success: true,
      workflow: {
        // Step 1: Contract signed
        contractSigned: contract.status === 'SIGNED',
        signedAt: contract.created_at,

        // Step 2: Cash payment confirmations
        clientConfirmed: contract.cash_payment_confirmed_by_client || false,
        vendorConfirmed: contract.cash_payment_confirmed_by_vendor || false,
        paymentConfirmedAt: contract.cash_payment_confirmed_at,

        // Step 3: Commission invoice
        invoiceGenerated: !!invoice,
        invoiceNumber: invoice?.invoice_number,
        invoiceSentAt: contract.commission_invoice_sent_at,
        invoiceStatus: invoice?.status,
        invoiceDueDate: invoice?.due_date,
        invoiceAmount: invoice?.total_amount,

        // Step 4: Commission payment
        commissionPaid: contract.commission_paid_at != null,
        commissionPaidAt: contract.commission_paid_at,
        commissionPaymentMethod: contract.commission_payment_method,

        // Current status
        currentStep: getCurrentWorkflowStep(contract, invoice),
        nextAction: getNextWorkflowAction(contract, invoice),
      },
    };
  } catch (error) {
    console.error('Error fetching workflow status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function getCurrentWorkflowStep(contract: any, invoice: any): string {
  if (contract.commission_paid_at) {
    return 'COMPLETED';
  }
  if (invoice?.status === 'SENT' || invoice?.status === 'OVERDUE') {
    return 'AWAITING_COMMISSION_PAYMENT';
  }
  if (contract.cash_payment_confirmed_by_client && contract.cash_payment_confirmed_by_vendor) {
    return 'INVOICE_GENERATED';
  }
  if (contract.cash_payment_confirmed_by_client || contract.cash_payment_confirmed_by_vendor) {
    return 'PARTIAL_CONFIRMATION';
  }
  if (contract.status === 'SIGNED') {
    return 'AWAITING_PAYMENT_CONFIRMATION';
  }
  return 'PENDING';
}

function getNextWorkflowAction(contract: any, invoice: any): string {
  if (contract.commission_paid_at) {
    return 'Workflow complete';
  }
  if (invoice?.status === 'OVERDUE') {
    return 'Pay overdue commission invoice';
  }
  if (invoice?.status === 'SENT') {
    return `Pay commission invoice by ${invoice.due_date}`;
  }
  if (contract.cash_payment_confirmed_by_client && contract.cash_payment_confirmed_by_vendor) {
    return 'Commission invoice will be generated';
  }
  if (contract.cash_payment_confirmed_by_client) {
    return 'Vendor needs to confirm cash payment received';
  }
  if (contract.cash_payment_confirmed_by_vendor) {
    return 'Client needs to confirm cash payment made';
  }
  return 'Complete cash payment and both parties confirm';
}

/**
 * Sends commission payment reminder to vendor
 */
export async function sendCommissionReminder(
  invoiceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: invoice, error: fetchError } = await supabase
      .from('commission_invoices')
      .select('*, vendors(*)')
      .eq('id', invoiceId)
      .single();

    if (fetchError || !invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    // Update reminder count
    await supabase
      .from('commission_invoices')
      .update({
        reminder_sent_at: new Date().toISOString(),
        reminder_count: (invoice.reminder_count || 0) + 1,
      })
      .eq('id', invoiceId);

    // TODO: Send actual email/SMS reminder
    console.log('Commission reminder sent for invoice:', invoice.invoice_number);

    return { success: true };
  } catch (error) {
    console.error('Error sending reminder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
