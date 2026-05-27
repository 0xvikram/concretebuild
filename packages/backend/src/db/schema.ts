import { pgTable, uuid, varchar, text, timestamp, boolean, numeric, integer, index, pgEnum } from "drizzle-orm/pg-core";

// Enums
export const kycStatusEnum = pgEnum('kyc_status', ['none', 'pending', 'approved', 'rejected']);
export const userRoleEnum = pgEnum('user_role', ['investor', 'property_owner', 'moderator', 'admin', 'tenant']);
export const propertyStatusEnum = pgEnum('property_status', ['draft', 'pending_review', 'approved', 'rejected', 'active', 'investment_closed', 'completed']);
export const assetTypeEnum = pgEnum('asset_type', ['residential', 'commercial', 'mixed', 'industrial', 'land']);
export const documentTypeEnum = pgEnum('document_type', ['title_deed', 'valuation_report', 'legal_clearance', 'identity_proof', 'tax_certificate', 'building_permit', 'other']);
export const distributionStatusEnum = pgEnum('distribution_status', ['deposit_pending', 'deposited', 'verified', 'distributing', 'distributed', 'failed']);
export const rewardTypeEnum = pgEnum('reward_type', ['listing', 'investment', 'rent', 'holding', 'manual', 'other']);
export const rewardStatusEnum = pgEnum('reward_status', ['pending', 'issued', 'failed']);

// Users
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletAddress: varchar('wallet_address', { length: 42 }).unique().notNull(),
  email: varchar('email', { length: 255 }),
  displayName: varchar('display_name', { length: 255 }),
  kycStatus: kycStatusEnum('kyc_status').default('none'),
  kycProvider: varchar('kyc_provider', { length: 100 }),
  kycReferenceId: varchar('kyc_reference_id', { length: 255 }),
  role: userRoleEnum('role').default('investor'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  walletIdx: index('users_wallet_idx').on(table.walletAddress)
}));

// Properties
export const properties = pgTable('properties', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  shortDescription: varchar('short_description', { length: 300 }),
  locationCountry: varchar('location_country', { length: 100 }).notNull(),
  locationCity: varchar('location_city', { length: 100 }).notNull(),
  locationAddress: varchar('location_address', { length: 500 }),
  locationLat: numeric('location_lat', { precision: 10, scale: 7 }),
  locationLng: numeric('location_lng', { precision: 10, scale: 7 }),
  assetType: assetTypeEnum('asset_type'),
  totalValuationUsdc: numeric('total_valuation_usdc', { precision: 30, scale: 6 }).notNull(),
  minInvestmentUsdc: numeric('min_investment_usdc', { precision: 30, scale: 6 }).default('100000000'),
  expectedRoiAnnual: numeric('expected_roi_annual', { precision: 6, scale: 2 }),
  expectedMonthlyYield: numeric('expected_monthly_yield', { precision: 30, scale: 6 }),
  investmentTermMonths: integer('investment_term_months'),
  status: propertyStatusEnum('status').default('draft'),
  contractAddress: varchar('contract_address', { length: 42 }),
  chainId: integer('chain_id').default(1),
  totalShares: integer('total_shares').default(10000),
  moderatorId: uuid('moderator_id').references(() => users.id),
  reviewNotes: text('review_notes'),
  rejectionReason: text('rejection_reason'),
  reviewedAt: timestamp('reviewed_at'),
  deployedAt: timestamp('deployed_at'),
  activatedAt: timestamp('activated_at'),
  featured: boolean('featured').default(false),
  sortOrder: integer('sort_order').default(0),
  ipfsMetadataCid: varchar('ipfs_metadata_cid', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  statusIdx: index('properties_status_idx').on(table.status),
  contractIdx: index('properties_contract_idx').on(table.contractAddress),
  ownerIdx: index('properties_owner_idx').on(table.ownerId)
}));

// Property Documents
export const propertyDocuments = pgTable('property_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  documentType: documentTypeEnum('document_type').notNull(),
  displayName: varchar('display_name', { length: 255 }),
  fileUrl: varchar('file_url', { length: 1000 }).notNull(),
  fileSize: numeric('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  isPublic: boolean('is_public').default(false),
  isVerified: boolean('is_verified').default(false),
  verifiedBy: uuid('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at'),
  uploadedAt: timestamp('uploaded_at').defaultNow()
});

// Property Images
export const propertyImages = pgTable('property_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }).notNull(),
  imageUrl: varchar('image_url', { length: 1000 }).notNull(),
  thumbnailUrl: varchar('thumbnail_url', { length: 1000 }),
  isPrimary: boolean('is_primary').default(false),
  caption: varchar('caption', { length: 500 }),
  sortOrder: integer('sort_order').default(0),
  uploadedAt: timestamp('uploaded_at').defaultNow()
});

// Investments
export const investments = pgTable('investments', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').references(() => properties.id).notNull(),
  investorId: uuid('investor_id').references(() => users.id).notNull(),
  walletAddress: varchar('wallet_address', { length: 42 }).notNull(),
  usdcAmount: numeric('usdc_amount', { precision: 30, scale: 6 }).notNull(),
  sharesAllocated: numeric('shares_allocated', { precision: 20, scale: 0 }).notNull(),
  sharePctBps: numeric('share_pct_bps', { precision: 10, scale: 4 }),
  txHash: varchar('tx_hash', { length: 66 }).unique().notNull(),
  blockNumber: numeric('block_number'),
  blockTimestamp: timestamp('block_timestamp'),
  syncedAt: timestamp('synced_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  investorIdx: index('investments_investor_idx').on(table.investorId),
  propertyIdx: index('investments_property_idx').on(table.propertyId),
  txIdx: index('investments_tx_idx').on(table.txHash)
}));

// Profit Distributions
export const profitDistributions = pgTable('profit_distributions', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').references(() => properties.id).notNull(),
  depositedById: uuid('deposited_by_id').references(() => users.id),
  totalAmountUsdc: numeric('total_amount_usdc', { precision: 30, scale: 6 }).notNull(),
  description: text('description'),
  depositTxHash: varchar('deposit_tx_hash', { length: 66 }),
  distributionTxHash: varchar('distribution_tx_hash', { length: 66 }),
  status: distributionStatusEnum('status').default('deposit_pending'),
  verifiedById: uuid('verified_by_id').references(() => users.id),
  verifiedAt: timestamp('verified_at'),
  distributedAt: timestamp('distributed_at'),
  failureReason: text('failure_reason'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  propertyIdx: index('distributions_property_idx').on(table.propertyId),
  statusIdx: index('distributions_status_idx').on(table.status)
}));

// CBLD Rewards
export const cbldRewards = pgTable('cbld_rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipientId: uuid('recipient_id').references(() => users.id).notNull(),
  walletAddress: varchar('wallet_address', { length: 42 }).notNull(),
  amount: numeric('amount', { precision: 36, scale: 18 }).notNull(),
  rewardType: rewardTypeEnum('reward_type').notNull(),
  referenceId: uuid('reference_id'),
  txHash: varchar('tx_hash', { length: 66 }),
  status: rewardStatusEnum('status').default('pending'),
  issuedAt: timestamp('issued_at'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  recipientIdx: index('rewards_recipient_idx').on(table.recipientId)
}));

// Audit Log
export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: uuid('actor_id').references(() => users.id),
  actorWallet: varchar('actor_wallet', { length: 42 }),
  action: varchar('action', { length: 255 }).notNull(),
  entityType: varchar('entity_type', { length: 100 }),
  entityId: uuid('entity_id'),
  metadata: text('metadata'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  actorIdx: index('audit_actor_idx').on(table.actorId),
  actionIdx: index('audit_action_idx').on(table.action),
  createdIdx: index('audit_created_idx').on(table.createdAt)
}));

// Platform Settings
export const platformSettings = pgTable('platform_settings', {
  key: varchar('key', { length: 255 }).primaryKey(),
  value: text('value'),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at').defaultNow()
});
