/**
 * Email Notification System for EventFoundry
 *
 * This module handles all email notifications for the two-tier bidding system.
 * In production, integrate with services like SendGrid, Resend, or AWS SES.
 */

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface ShortlistNotificationData {
  craftsmanName: string;
  craftsmanEmail: string;
  eventTitle: string;
  eventType: string;
  eventDate: string;
  competitiveMessage: string;
  revisionDeadline: string;
  revisionUrl: string;
}

interface RejectionNotificationData {
  craftsmanName: string;
  craftsmanEmail: string;
  eventTitle: string;
  eventType: string;
}

interface WinnerNotificationData {
  craftsmanName: string;
  craftsmanEmail: string;
  eventTitle: string;
  eventType: string;
  totalAmount: number;
  clientName: string;
  contractUrl: string;
}

interface BidRevisionNotificationData {
  clientName: string;
  clientEmail: string;
  craftsmanName: string;
  eventTitle: string;
  originalAmount: number;
  revisedAmount: number;
}

/**
 * Generate shortlist notification email
 */
export function generateShortlistEmail(data: ShortlistNotificationData): EmailTemplate {
  const subject = `🎉 Shortlisted: ${data.eventTitle}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f97316 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .highlight { background: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #f97316, #ec4899); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏆 Congratulations!</h1>
          <p>You've Been Shortlisted</p>
        </div>
        <div class="content">
          <p>Dear ${data.craftsmanName},</p>

          <p>Great news! Your bid has been shortlisted for the following event:</p>

          <div class="highlight">
            <strong>${data.eventTitle}</strong><br>
            Event Type: ${data.eventType}<br>
            Date: ${data.eventDate}
          </div>

          <h3>Your Competitive Position:</h3>
          <p><strong>${data.competitiveMessage}</strong></p>

          <h3>Revision Window:</h3>
          <p>You have until <strong>${new Date(data.revisionDeadline).toLocaleString('en-IN')}</strong> to revise your bid if you choose to.</p>

          <p>This is your opportunity to review and potentially adjust your pricing based on your competitive position.</p>

          <a href="${data.revisionUrl}" class="button">Review & Revise Bid</a>

          <h3>What Happens Next?</h3>
          <ol>
            <li>Review your competitive position</li>
            <li>Decide if you want to revise your bid (optional)</li>
            <li>The client will review all final bids and vendor profiles</li>
            <li>You'll be notified of the final decision</li>
          </ol>

          <p>Best of luck!</p>

          <p>Best regards,<br>
          <strong>The EventFoundry Team</strong></p>
        </div>
        <div class="footer">
          <p>EventFoundry - Where extraordinary events are forged 🔥⚒️</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Congratulations ${data.craftsmanName}!

You've been shortlisted for: ${data.eventTitle}
Event Type: ${data.eventType}
Date: ${data.eventDate}

Your Competitive Position: ${data.competitiveMessage}

You have until ${new Date(data.revisionDeadline).toLocaleString('en-IN')} to revise your bid.

Visit ${data.revisionUrl} to review and revise your bid.

Best regards,
The EventFoundry Team
  `;

  return { subject, html, text };
}

/**
 * Generate rejection notification email
 */
export function generateRejectionEmail(data: RejectionNotificationData): EmailTemplate {
  const subject = `Update: ${data.eventTitle}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #64748b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Event Update</h1>
        </div>
        <div class="content">
          <p>Dear ${data.craftsmanName},</p>

          <p>Thank you for submitting your bid for <strong>${data.eventTitle}</strong>.</p>

          <p>While we appreciate your interest and effort, we regret to inform you that the client has decided to move forward with other vendors for this event.</p>

          <p>We encourage you to:</p>
          <ul>
            <li>Continue building your portfolio</li>
            <li>Keep your profile updated</li>
            <li>Stay active on EventFoundry for future opportunities</li>
          </ul>

          <p>We look forward to working with you on future events!</p>

          <p>Best regards,<br>
          <strong>The EventFoundry Team</strong></p>
        </div>
        <div class="footer">
          <p>EventFoundry - Where extraordinary events are forged 🔥⚒️</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Dear ${data.craftsmanName},

Thank you for your bid on ${data.eventTitle}.

The client has decided to move forward with other vendors for this event. We appreciate your interest and encourage you to continue bidding on future opportunities.

Best regards,
The EventFoundry Team
  `;

  return { subject, html, text };
}

/**
 * Generate winner notification email
 */
export function generateWinnerEmail(data: WinnerNotificationData): EmailTemplate {
  const subject = `🎉 You Won! ${data.eventTitle}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .highlight { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏆 Congratulations!</h1>
          <h2>You've Been Selected!</h2>
        </div>
        <div class="content">
          <p>Dear ${data.craftsmanName},</p>

          <p><strong>Excellent news!</strong> You have been selected as the winning vendor for:</p>

          <div class="highlight">
            <strong>${data.eventTitle}</strong><br>
            Event Type: ${data.eventType}<br>
            Total Contract Value: ₹${data.totalAmount.toLocaleString('en-IN')}<br>
            Client: ${data.clientName}
          </div>

          <h3>Next Steps:</h3>
          <ol>
            <li>Review and sign the contract</li>
            <li>Coordinate with the client for event details</li>
            <li>Begin preparation for the event</li>
          </ol>

          <a href="${data.contractUrl}" class="button">View & Sign Contract</a>

          <p><strong>Important:</strong> Please review and sign the contract within 48 hours to confirm your acceptance.</p>

          <p>We're excited to see you bring this event to life!</p>

          <p>Best regards,<br>
          <strong>The EventFoundry Team</strong></p>
        </div>
        <div class="footer">
          <p>EventFoundry - Where extraordinary events are forged 🔥⚒️</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Congratulations ${data.craftsmanName}!

You've been selected as the winning vendor for ${data.eventTitle}!

Contract Value: ₹${data.totalAmount.toLocaleString('en-IN')}
Client: ${data.clientName}

Please review and sign the contract within 48 hours: ${data.contractUrl}

Best regards,
The EventFoundry Team
  `;

  return { subject, html, text };
}

/**
 * Generate bid revision notification for client
 */
export function generateBidRevisionEmail(data: BidRevisionNotificationData): EmailTemplate {
  const subject = `Bid Revised: ${data.eventTitle}`;

  const savingsAmount = data.originalAmount - data.revisedAmount;
  const savingsPercent = Math.round((savingsAmount / data.originalAmount) * 100);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .highlight { background: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📝 Bid Revision Notice</h1>
        </div>
        <div class="content">
          <p>Dear ${data.clientName},</p>

          <p>A shortlisted vendor has revised their bid for your event:</p>

          <div class="highlight">
            <strong>${data.eventTitle}</strong><br>
            Vendor: ${data.craftsmanName}<br><br>
            Original Bid: ₹${data.originalAmount.toLocaleString('en-IN')}<br>
            Revised Bid: ₹${data.revisedAmount.toLocaleString('en-IN')}<br>
            ${savingsAmount > 0 ? `<strong style="color: #10b981;">Savings: ₹${savingsAmount.toLocaleString('en-IN')} (${savingsPercent}%)</strong>` : `<strong style="color: #ef4444;">Increase: ₹${Math.abs(savingsAmount).toLocaleString('en-IN')} (${Math.abs(savingsPercent)}%)</strong>`}
          </div>

          <p>You can review the updated bid details in your dashboard.</p>

          <p>Best regards,<br>
          <strong>The EventFoundry Team</strong></p>
        </div>
        <div class="footer">
          <p>EventFoundry - Where extraordinary events are forged 🔥⚒️</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Dear ${data.clientName},

${data.craftsmanName} has revised their bid for ${data.eventTitle}:

Original Bid: ₹${data.originalAmount.toLocaleString('en-IN')}
Revised Bid: ₹${data.revisedAmount.toLocaleString('en-IN')}
${savingsAmount > 0 ? `Savings: ₹${savingsAmount.toLocaleString('en-IN')}` : `Increase: ₹${Math.abs(savingsAmount).toLocaleString('en-IN')}`}

Review the updated bid in your dashboard.

Best regards,
The EventFoundry Team
  `;

  return { subject, html, text };
}

/**
 * Send email notification
 * In production, integrate with email service (SendGrid, Resend, AWS SES, etc.)
 */
export async function sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
  try {
    // Check if we're in production with email service configured
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey && process.env.NODE_ENV === 'production') {
      // Use Resend in production
      const { Resend } = await import('resend');
      const resend = new Resend(resendApiKey);

      await resend.emails.send({
        from: 'EventFoundry <forge@eventfoundry.com>',
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`✅ Email sent to ${to}: ${template.subject}`);
      return true;
    } else {
      // Development mode - log to console
      console.log('\n=== 📧 EMAIL NOTIFICATION (DEV MODE) ===');
      console.log('To:', to);
      console.log('Subject:', template.subject);
      console.log('HTML Length:', template.html.length);
      console.log('Preview:', template.text.substring(0, 200) + '...');
      console.log('========================================\n');

      return true;
    }
  } catch (error) {
    console.error('❌ Email send error:', error);
    return false;
  }
}
