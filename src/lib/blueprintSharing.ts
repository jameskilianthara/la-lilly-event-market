import type { ForgeBlueprint, ClientBrief, ClientNotes, ReferenceImage } from '../types/blueprint';

export interface BlueprintShareData {
  blueprint: ForgeBlueprint;
  clientBrief: ClientBrief;
  clientNotes: ClientNotes;
  referenceImages: ReferenceImage[];
  blueprintId: string;
}

/**
 * Generate a shareable URL for the blueprint
 */
export function generateBlueprintShareUrl(blueprintId: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}/blueprint/${blueprintId}`;
}

/**
 * Copy blueprint share URL to clipboard
 */
export async function copyBlueprintShareUrl(blueprintId: string): Promise<boolean> {
  try {
    const shareUrl = generateBlueprintShareUrl(blueprintId);
    await navigator.clipboard.writeText(shareUrl);
    return true;
  } catch (error) {
    console.error('Failed to copy share URL:', error);
    return false;
  }
}

/**
 * Share blueprint via Web Share API (mobile) or fallback options
 */
export async function shareBlueprint(blueprintId: string, clientBrief: ClientBrief): Promise<void> {
  const shareUrl = generateBlueprintShareUrl(blueprintId);
  const shareTitle = `EventFoundry: ${clientBrief.event_type || 'Event'} Blueprint`;
  const shareText = `Check out this professional event blueprint for a ${clientBrief.event_type || 'special'} event in ${clientBrief.city || 'your location'}.`;

  // Check if Web Share API is supported
  if (navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
      return;
    } catch (error) {
      // User cancelled or share failed, fall back to clipboard
      console.log('Web Share API failed, falling back to clipboard');
    }
  }

  // Fallback: Copy to clipboard
  const success = await copyBlueprintShareUrl(blueprintId);
  if (success) {
    // Show success message (handled by component)
    return;
  }

  // Last fallback: Open share URL in new window
  window.open(shareUrl, '_blank');
}

/**
 * Share blueprint via WhatsApp
 */
export function shareBlueprintViaWhatsApp(blueprintId: string, clientBrief: ClientBrief): void {
  const shareUrl = generateBlueprintShareUrl(blueprintId);
  const message = `Check out this professional event blueprint for a ${clientBrief.event_type || 'special'} event in ${clientBrief.city || 'your location'}: ${shareUrl}`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}

/**
 * Share blueprint via email
 */
export function shareBlueprintViaEmail(blueprintId: string, clientBrief: ClientBrief): void {
  const shareUrl = generateBlueprintShareUrl(blueprintId);
  const subject = `EventFoundry: ${clientBrief.event_type || 'Event'} Blueprint`;
  const body = `Hi,

I thought you might be interested in this professional event blueprint I created using EventFoundry.

Event Details:
- Type: ${clientBrief.event_type || 'Special Event'}
- Location: ${clientBrief.city || 'TBD'}
- Date: ${clientBrief.date ? new Date(clientBrief.date).toLocaleDateString() : 'TBD'}
- Guests: ${clientBrief.guest_count || 'TBD'}

View the complete blueprint here: ${shareUrl}

Best regards,
[Your Name]`;

  const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(emailUrl, '_blank');
}

/**
 * Generate social media share URLs
 */
export function getSocialShareUrls(blueprintId: string, clientBrief: ClientBrief) {
  const shareUrl = generateBlueprintShareUrl(blueprintId);
  const text = `Check out this professional event blueprint for a ${clientBrief.event_type || 'special'} event! Created with EventFoundry.`;

  return {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${shareUrl}`)}`
  };
}









