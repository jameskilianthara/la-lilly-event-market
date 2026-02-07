import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { ForgeBlueprint, ClientBrief, ClientNotes, ReferenceImage } from '../types/blueprint';

export interface BlueprintPDFData {
  blueprint: ForgeBlueprint;
  clientBrief: ClientBrief;
  clientNotes: ClientNotes;
  referenceImages: ReferenceImage[];
  blueprintId: string;
  generatedDate: string;
  executiveSummary: string;
  specialInstructions: string;
}

/**
 * Generate a professional PDF from blueprint data
 */
export async function generateBlueprintPDF(data: BlueprintPDFData): Promise<void> {
  const {
    blueprint,
    clientBrief,
    clientNotes,
    blueprintId,
    generatedDate,
    executiveSummary,
    specialInstructions
  } = data;

  try {
    // Create new PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Helper function to add text with word wrapping
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize = 11) => {
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return y + (lines.length * fontSize * 0.4);
    };

    // Helper function to check if we need a new page
    const checkNewPage = (requiredHeight: number) => {
      if (yPosition + requiredHeight > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Title Page
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('EventFoundry', margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(18);
    pdf.text('Professional Event Blueprint', margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(14);
    pdf.text(`${clientBrief.event_type || 'Event'} Blueprint`, margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated: ${generatedDate}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Blueprint ID: ${blueprintId}`, margin, yPosition);
    yPosition += 20;

    // Event Details
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Event Details', margin, yPosition);
    yPosition += 12;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');

    const eventDetails = [
      `Event Type: ${clientBrief.event_type || 'Not specified'}`,
      `Date: ${clientBrief.date ? new Date(clientBrief.date).toLocaleDateString('en-IN') : 'TBD'}`,
      `Location: ${clientBrief.city || 'TBD'}`,
      `Guest Count: ${clientBrief.guest_count || 'TBD'}`,
      `Venue Status: ${clientBrief.venue_status === 'booked' ? 'Confirmed' : 'Required'}`
    ];

    eventDetails.forEach(detail => {
      pdf.text(detail, margin, yPosition);
      yPosition += 7;
    });

    yPosition += 10;

    // Executive Summary
    checkNewPage(50);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Executive Summary', margin, yPosition);
    yPosition += 12;

    yPosition = addWrappedText(executiveSummary || 'No executive summary provided.', margin, yPosition, pageWidth - 2 * margin);

    yPosition += 10;

    // Requirements Sections
    blueprint.sections.forEach((section, sectionIndex) => {
      checkNewPage(60); // Ensure space for section header and at least a few items

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${sectionIndex + 1}. ${section.title}`, margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      yPosition = addWrappedText(section.description, margin, yPosition, pageWidth - 2 * margin, 10);
      yPosition += 8;

      section.items.forEach((item, itemIndex) => {
        checkNewPage(20);

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`• ${item.label}`, margin + 5, yPosition);

        const userNote = clientNotes[item.id];
        if (userNote && userNote.trim()) {
          yPosition += 6;
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          yPosition = addWrappedText(userNote.trim(), margin + 10, yPosition, pageWidth - 2 * margin - 10, 10);
        } else {
          yPosition += 6;
        }

        yPosition += 3;
      });

      yPosition += 8;
    });

    // Special Instructions
    if (specialInstructions && specialInstructions.trim()) {
      checkNewPage(40);

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Special Instructions', margin, yPosition);
      yPosition += 12;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      yPosition = addWrappedText(specialInstructions.trim(), margin, yPosition, pageWidth - 2 * margin, 10);
    }

    // Footer
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.text(`EventFoundry Professional Blueprint - Page ${i} of ${totalPages}`, margin, pageHeight - 10);
      pdf.text(`Generated: ${generatedDate}`, pageWidth - margin - 40, pageHeight - 10);
    }

    // Generate filename
    const eventType = clientBrief.event_type?.toLowerCase().replace(/\s+/g, '-') || 'event';
    const filename = `eventfoundry-${eventType}-blueprint-${Date.now()}.pdf`;

    // Save the PDF
    pdf.save(filename);

    console.log('PDF generated successfully:', filename);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
}

/**
 * Generate PDF from HTML element (alternative approach using html2canvas)
 */
export async function generatePDFFromElement(elementId: string, filename?: string): Promise<void> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // Create canvas from HTML element
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff'
    });

    // Create PDF from canvas
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const finalFilename = filename || `blueprint-${Date.now()}.pdf`;
    pdf.save(finalFilename);

    console.log('PDF generated from element:', finalFilename);

  } catch (error) {
    console.error('Error generating PDF from element:', error);
    throw new Error('Failed to generate PDF from page content. Please try again.');
  }
}









