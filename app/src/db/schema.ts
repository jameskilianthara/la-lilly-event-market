// EventFoundry Database Schema - Foundry Tables
// Aligned with CLAUDE.md Section 11: Data Model (Postgres)

import { pgTable, text, timestamp, json, integer, decimal, varchar, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

export const foundryRoleEnum = pgEnum('foundry_role', ['CLIENT', 'CRAFTSMAN', 'FORGE_ADMIN']);

export const forgeStatusEnum = pgEnum('forge_status', [
  'BLUEPRINT_READY',
  'OPEN_FOR_BIDS',
  'CRAFTSMEN_BIDDING',
  'SHORTLIST_REVIEW',
  'COMMISSIONED',
  'IN_FORGE',
  'COMPLETED',
  'ARCHIVED'
]);

export const contractStatusEnum = pgEnum('contract_status', [
  'DRAFT',
  'PENDING_SIGNATURES',
  'SIGNED',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED'
]);

export const forgeComplexityEnum = pgEnum('forge_complexity', ['apprentice', 'craftsman', 'master']);

export const aiPipelineStatusEnum = pgEnum('ai_pipeline_status', ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']);

// ============================================================================
// CORE FOUNDRY TABLES
// ============================================================================

// Users (foundry_users) - All platform users
export const foundryUsers = pgTable('foundry_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  foundryRole: foundryRoleEnum('foundry_role').notNull().default('CLIENT'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Master Craftsmen (master_craftsmen) - Vendor profiles
export const masterCraftsmen = pgTable('master_craftsmen', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => foundryUsers.id),
  foundryName: varchar('foundry_name', { length: 255 }).notNull(),
  craftSpecialties: text('craft_specialties').array().notNull(), // ['stage_mastery', 'floral_artistry', etc.]
  forgeLocation: varchar('forge_location', { length: 255 }).notNull(), // City/Region
  craftsmanRating: decimal('craftsman_rating', { precision: 3, scale: 2 }).default('0.00'),
  foundryProfileJson: json('foundry_profile_json'), // Additional profile data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Forge Blueprints (forge_blueprints) - Checklist templates
export const forgeBlueprints = pgTable('forge_blueprints', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventTypeKey: varchar('event_type_key', { length: 100 }).notNull().unique(), // 'wedding_forge', 'corporate_forge', etc.
  version: varchar('version', { length: 50 }).notNull(),
  blueprintContentJson: json('blueprint_content_json').notNull(), // Full blueprint structure
  forgeComplexity: forgeComplexityEnum('forge_complexity').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Forge Projects (events) - Client event projects
export const forgeProjects = pgTable('forge_projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerUserId: uuid('owner_user_id').notNull().references(() => foundryUsers.id),
  title: varchar('title', { length: 255 }).notNull(),
  clientBriefJson: json('client_brief_json').notNull(), // { event_type, date, city, guest_count, venue_status }
  blueprintId: uuid('blueprint_id').references(() => forgeBlueprints.id),
  blueprintSnapshotJson: json('blueprint_snapshot_json').notNull(), // Immutable blueprint at creation time
  forgeStatus: forgeStatusEnum('forge_status').notNull().default('BLUEPRINT_READY'),
  forgeFloorPrice: decimal('forge_floor_price', { precision: 10, scale: 2 }), // Lowest bid amount
  biddingClosesAt: timestamp('bidding_closes_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Craft Proposals (bids) - Craftsman submissions
export const craftProposals = pgTable('craft_proposals', {
  id: uuid('id').primaryKey().defaultRandom(),
  forgeProjectId: uuid('forge_project_id').notNull().references(() => forgeProjects.id),
  craftsmanId: uuid('craftsman_id').notNull().references(() => masterCraftsmen.id),
  proposalPayloadJson: json('proposal_payload_json').notNull(), // Full proposal structure
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  totalForgeCost: decimal('total_forge_cost', { precision: 10, scale: 2 }).notNull(),
  craftAttachments: text('craft_attachments').array(), // URLs to visual forge renders
  estimatedForgeTime: varchar('estimated_forge_time', { length: 100 }), // "14 days"
  isShortlisted: varchar('is_shortlisted', { length: 10 }).default('false'), // 'true' or 'false'
  forgePremiumPercentage: decimal('forge_premium_percentage', { precision: 5, scale: 2 }), // % above floor price
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Forge Contracts (contracts) - Signed agreements
export const forgeContracts = pgTable('forge_contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  forgeProjectId: uuid('forge_project_id').notNull().references(() => forgeProjects.id),
  proposalId: uuid('proposal_id').notNull().references(() => craftProposals.id),
  contractJson: json('contract_json').notNull(), // Full contract details
  pdfUrl: varchar('pdf_url', { length: 500 }),
  signaturesJson: json('signatures_json'), // { client: {...}, craftsman: {...}, timestamp, hash }
  contractStatus: contractStatusEnum('contract_status').notNull().default('DRAFT'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Foundry AI Pipeline (foundry_ai_pipeline) - AI generation jobs
export const foundryAiPipeline = pgTable('foundry_ai_pipeline', {
  id: uuid('id').primaryKey().defaultRandom(),
  forgeType: varchar('forge_type', { length: 100 }).notNull(), // 'visual_forge', 'blueprint_selection', etc.
  inputJson: json('input_json').notNull(), // Input parameters for AI
  status: aiPipelineStatusEnum('status').notNull().default('PENDING'),
  resultUrls: text('result_urls').array(), // Output image/file URLs
  forgeCost: decimal('forge_cost', { precision: 8, scale: 2 }), // Cost of generation
  craftsmanId: uuid('craftsman_id').references(() => masterCraftsmen.id), // Optional: who requested
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const foundryUsersRelations = relations(foundryUsers, ({ one, many }) => ({
  craftsmanProfile: one(masterCraftsmen, {
    fields: [foundryUsers.id],
    references: [masterCraftsmen.userId],
  }),
  forgeProjects: many(forgeProjects),
}));

export const masterCraftsmenRelations = relations(masterCraftsmen, ({ one, many }) => ({
  user: one(foundryUsers, {
    fields: [masterCraftsmen.userId],
    references: [foundryUsers.id],
  }),
  craftProposals: many(craftProposals),
}));

export const forgeProjectsRelations = relations(forgeProjects, ({ one, many }) => ({
  owner: one(foundryUsers, {
    fields: [forgeProjects.ownerUserId],
    references: [foundryUsers.id],
  }),
  blueprint: one(forgeBlueprints, {
    fields: [forgeProjects.blueprintId],
    references: [forgeBlueprints.id],
  }),
  craftProposals: many(craftProposals),
  forgeContract: one(forgeContracts),
}));

export const craftProposalsRelations = relations(craftProposals, ({ one }) => ({
  forgeProject: one(forgeProjects, {
    fields: [craftProposals.forgeProjectId],
    references: [forgeProjects.id],
  }),
  craftsman: one(masterCraftsmen, {
    fields: [craftProposals.craftsmanId],
    references: [masterCraftsmen.id],
  }),
}));

export const forgeContractsRelations = relations(forgeContracts, ({ one }) => ({
  forgeProject: one(forgeProjects, {
    fields: [forgeContracts.forgeProjectId],
    references: [forgeProjects.id],
  }),
  proposal: one(craftProposals, {
    fields: [forgeContracts.proposalId],
    references: [craftProposals.id],
  }),
}));

// ============================================================================
// TYPES (for TypeScript imports)
// ============================================================================

export type FoundryUser = typeof foundryUsers.$inferSelect;
export type NewFoundryUser = typeof foundryUsers.$inferInsert;

export type MasterCraftsman = typeof masterCraftsmen.$inferSelect;
export type NewMasterCraftsman = typeof masterCraftsmen.$inferInsert;

export type ForgeBlueprint = typeof forgeBlueprints.$inferSelect;
export type NewForgeBlueprint = typeof forgeBlueprints.$inferInsert;

export type ForgeProject = typeof forgeProjects.$inferSelect;
export type NewForgeProject = typeof forgeProjects.$inferInsert;

export type CraftProposal = typeof craftProposals.$inferSelect;
export type NewCraftProposal = typeof craftProposals.$inferInsert;

export type ForgeContract = typeof forgeContracts.$inferSelect;
export type NewForgeContract = typeof forgeContracts.$inferInsert;

export type FoundryAiJob = typeof foundryAiPipeline.$inferSelect;
export type NewFoundryAiJob = typeof foundryAiPipeline.$inferInsert;
