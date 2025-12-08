import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';

// AI Creative System tables with acs_ prefix
export const projects = pgTable('acs_projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  productUrl: text('product_url'),
  productName: text('product_name'),
  productCategory: text('product_category'),
  targetInfo: jsonb('target_info'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const personas = pgTable('acs_personas', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  ageRange: text('age_range'),
  gender: text('gender'),
  occupation: text('occupation'),
  incomeLevel: text('income_level'),
  interests: jsonb('interests').default([]),
  painPoints: jsonb('pain_points').default([]),
  buyingMotivation: text('buying_motivation'),
  communicationStyle: text('communication_style'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const banners = pgTable('acs_banners', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  personaId: uuid('persona_id').references(() => personas.id, {
    onDelete: 'set null',
  }),
  prompt: text('prompt').notNull(),
  imagePath: text('image_path'),
  aspectRatio: text('aspect_ratio').notNull(),
  size: text('size').notNull(),
  status: text('status').notNull().default('pending'),
  metaAdId: text('meta_ad_id'),
  errorMessage: text('error_message'),
  generationStartedAt: timestamp('generation_started_at', { withTimezone: true }),
  generationCompletedAt: timestamp('generation_completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Type exports for use with Drizzle ORM
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Persona = typeof personas.$inferSelect;
export type NewPersona = typeof personas.$inferInsert;
export type Banner = typeof banners.$inferSelect;
export type NewBanner = typeof banners.$inferInsert;
