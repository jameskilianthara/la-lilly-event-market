/**
 * Contract Generation Library
 * Generates professional PDF contracts for EventFoundry
 */

import { jsPDF } from 'jspdf';
import type { Event, Bid, User, Vendor } from '@/types/database';

export interface ContractData {
  event: Event;
  bid: Bid;
  client: User;
  vendor: Vendor & { user?: User };
  contractId: string;
}

export interface ContractJSON {
  contractId: string;
  eventId: string;
  bidId: string;
  clientName: string;
  clientEmail: string;
  vendorName: string;
  vendorEmail: string;
  eventTitle: string;
  eventType: string;
  eventDate: string | null;
  eventLocation: string | null;
  guestCount: number | null;
  scopeOfWork: string[];
  totalAmount: number;
  subtotal: number;
  taxes: number;
  depositAmount: number;
  milestones: Array<{
    name: string;
    percentage: number;
    amount: number;
    description: string;
  }>;
  forgeItems: any;
  terms: string[];
  generatedAt: string;
}

/**
 * Generate contract JSON data structure
 */
export function generateContractJSON(data: ContractData): ContractJSON {
  const { event, bid, client, vendor, contractId } = data;

  // Extract scope of work from bid
  const scopeOfWork: string[] = [];
  if (bid.craft_specialties && Array.isArray(bid.craft_specialties)) {
    scopeOfWork.push(...bid.craft_specialties);
  }

  // Calculate milestones (30% deposit, 50% on start, 20% on completion)
  const depositAmount = bid.total_forge_cost * 0.30;
  const milestones = [
    {
      name: 'Contract Signing Deposit',
      percentage: 30,
      amount: depositAmount,
      description: 'Due upon contract execution'
    },
    {
      name: 'Event Preparation',
      percentage: 50,
      amount: bid.total_forge_cost * 0.50,
      description: 'Due 14 days before event date'
    },
    {
      name: 'Event Completion',
      percentage: 20,
      amount: bid.total_forge_cost * 0.20,
      description: 'Due upon successful event completion'
    }
  ];

  return {
    contractId,
    eventId: event.id,
    bidId: bid.id,
    clientName: client.full_name || 'Client',
    clientEmail: client.email,
    vendorName: vendor.company_name || 'Vendor',
    vendorEmail: vendor.user?.email || '',
    eventTitle: event.title || 'Untitled Event',
    eventType: event.event_type || 'Event',
    eventDate: event.date,
    eventLocation: event.city || event.venue_name || 'TBD',
    guestCount: event.guest_count,
    scopeOfWork,
    totalAmount: bid.total_forge_cost,
    subtotal: bid.subtotal,
    taxes: bid.taxes || 0,
    depositAmount,
    milestones,
    forgeItems: bid.forge_items,
    terms: [
      'This contract is governed by the laws of India.',
      'All payments must be made via EventFoundry platform.',
      'Cancellation policy: 50% refund if cancelled 30+ days before event, 25% if 15-29 days, no refund within 14 days.',
      'Vendor warranties all services will be performed professionally and to industry standards.',
      'Force majeure events will be handled per platform policy.',
      'Any disputes will be resolved through arbitration in Mumbai, India.'
    ],
    generatedAt: new Date().toISOString()
  };
}

/**
 * Generate PDF contract from contract data
 */
export function generateContractPDF(contractJSON: ContractJSON): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Helper function to add text with word wrap
  const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);

    // Check if we need a new page
    if (yPosition + (lines.length * fontSize * 0.5) > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }

    doc.text(lines, margin, yPosition);
    yPosition += lines.length * fontSize * 0.5 + 5;
  };

  const addSpacing = (space: number = 5) => {
    yPosition += space;
  };

  // Header
  doc.setFillColor(219, 39, 119); // EventFoundry pink
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('EVENTFOUNDRY', margin, 20);
  doc.setFontSize(12);
  doc.text('Event Management Contract', pageWidth - margin - 80, 20);

  yPosition = 45;
  doc.setTextColor(0, 0, 0);

  // Contract Details
  addText('EVENT MANAGEMENT SERVICES CONTRACT', 16, true);
  addSpacing(3);
  addText(`Contract ID: ${contractJSON.contractId}`, 10);
  addText(`Generated: ${new Date(contractJSON.generatedAt).toLocaleDateString('en-IN')}`, 10);
  addSpacing(10);

  // Parties
  addText('PARTIES TO THIS AGREEMENT', 14, true);
  addSpacing(5);

  addText('CLIENT (Commissioner):', 12, true);
  addText(`Name: ${contractJSON.clientName}`);
  addText(`Email: ${contractJSON.clientEmail}`);
  addSpacing(5);

  addText('VENDOR (Service Provider):', 12, true);
  addText(`Company: ${contractJSON.vendorName}`);
  addText(`Email: ${contractJSON.vendorEmail}`);
  addSpacing(10);

  // Event Details
  addText('EVENT DETAILS', 14, true);
  addSpacing(5);
  addText(`Event Title: ${contractJSON.eventTitle}`);
  addText(`Event Type: ${contractJSON.eventType}`);
  if (contractJSON.eventDate) {
    addText(`Event Date: ${new Date(contractJSON.eventDate).toLocaleDateString('en-IN')}`);
  }
  if (contractJSON.eventLocation) {
    addText(`Location: ${contractJSON.eventLocation}`);
  }
  if (contractJSON.guestCount) {
    addText(`Expected Guests: ${contractJSON.guestCount}`);
  }
  addSpacing(10);

  // Scope of Work
  addText('SCOPE OF SERVICES', 14, true);
  addSpacing(5);
  if (contractJSON.scopeOfWork && contractJSON.scopeOfWork.length > 0) {
    contractJSON.scopeOfWork.forEach((service, index) => {
      addText(`${index + 1}. ${service}`);
    });
  } else {
    addText('Complete event management services as detailed in the accepted bid.');
  }
  addSpacing(10);

  // Financial Terms
  addText('FINANCIAL TERMS', 14, true);
  addSpacing(5);
  addText(`Subtotal: ₹${contractJSON.subtotal.toLocaleString('en-IN')}`);
  addText(`Taxes (GST): ₹${contractJSON.taxes.toLocaleString('en-IN')}`);
  addText(`Total Contract Value: ₹${contractJSON.totalAmount.toLocaleString('en-IN')}`, 12, true);
  addSpacing(10);

  // Payment Milestones
  addText('PAYMENT SCHEDULE', 14, true);
  addSpacing(5);
  contractJSON.milestones.forEach((milestone, index) => {
    addText(`Milestone ${index + 1}: ${milestone.name}`, 12, true);
    addText(`Amount: ₹${milestone.amount.toLocaleString('en-IN')} (${milestone.percentage}%)`);
    addText(`Due: ${milestone.description}`);
    addSpacing(3);
  });
  addSpacing(5);

  // Terms and Conditions
  addText('TERMS AND CONDITIONS', 14, true);
  addSpacing(5);
  contractJSON.terms.forEach((term, index) => {
    addText(`${index + 1}. ${term}`);
    addSpacing(2);
  });
  addSpacing(10);

  // Signatures Section
  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = margin;
  }

  addText('SIGNATURES', 14, true);
  addSpacing(10);

  // Two columns for signatures
  const col1X = margin;
  const col2X = pageWidth / 2 + 10;

  doc.setFontSize(10);
  doc.text('CLIENT SIGNATURE', col1X, yPosition);
  doc.text('VENDOR SIGNATURE', col2X, yPosition);

  yPosition += 25;
  doc.line(col1X, yPosition, col1X + 70, yPosition);
  doc.line(col2X, yPosition, col2X + 70, yPosition);

  yPosition += 10;
  doc.text(`Name: ${contractJSON.clientName}`, col1X, yPosition);
  doc.text(`Name: ${contractJSON.vendorName}`, col2X, yPosition);

  yPosition += 7;
  doc.text('Date: ______________', col1X, yPosition);
  doc.text('Date: ______________', col2X, yPosition);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Generated via EventFoundry Platform | forge@eventfoundry.com', pageWidth / 2, pageHeight - 10, { align: 'center' });

  return doc.output('blob');
}

/**
 * Upload contract PDF to Supabase storage
 */
export async function uploadContractPDF(
  contractId: string,
  pdfBlob: Blob,
  supabaseClient: any
): Promise<string | null> {
  try {
    const fileName = `contract_${contractId}_${Date.now()}.pdf`;
    const filePath = `contracts/${fileName}`;

    const { data, error } = await supabaseClient.storage
      .from('documents')
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (error) {
      console.error('Error uploading contract PDF:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('documents')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadContractPDF:', error);
    return null;
  }
}
