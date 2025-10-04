export interface ForgeBlueprint {
  id: string;
  eventType: string;
  displayName: string;
  version: string;
  forgeComplexity: 'apprentice' | 'craftsman' | 'master';
  sections: BlueprintSection[];
}

export interface BlueprintSection {
  id: string;
  title: string;
  description: string;
  items: BlueprintItem[];
}

export interface BlueprintItem {
  id: string;
  label: string;
  required?: boolean;
  category?: string;
  placeholder?: string;
}

export interface ClientBrief {
  event_type: string;
  date: string;
  city: string;
  guest_count: string;
  venue_status: string;
}

export interface ClientNotes {
  [itemId: string]: string;
}

export interface ReferenceImage {
  id: string;
  sectionId: string;
  url: string;
  filename: string;
  uploadedAt: Date;
}

export interface ForgeProject {
  id: string;
  title: string;
  owner_user_id: string;
  forge_status: 'BLUEPRINT_READY' | 'OPEN_FOR_BIDS' | 'CRAFTSMEN_BIDDING' | 'SHORTLIST_REVIEW' | 'COMMISSIONED' | 'IN_FORGE' | 'COMPLETED' | 'ARCHIVED';
  client_brief: ClientBrief;
  forge_blueprint: ForgeBlueprint;
  client_notes: ClientNotes;
  reference_images: ReferenceImage[];
  created_at: Date;
}