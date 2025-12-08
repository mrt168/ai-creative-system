import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  productUrl: text('product_url'),
  productName: text('product_name'),
  productCategory: text('product_category'),
  targetInfo: text('target_info'), // JSON string
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const personas = sqliteTable('personas', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  ageRange: text('age_range'),
  gender: text('gender'),
  occupation: text('occupation'),
  incomeLevel: text('income_level'),
  interests: text('interests'), // JSON array
  painPoints: text('pain_points'), // JSON array
  buyingMotivation: text('buying_motivation'),
  communicationStyle: text('communication_style'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const banners = sqliteTable('banners', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  personaId: text('persona_id').references(() => personas.id, {
    onDelete: 'set null',
  }),
  prompt: text('prompt').notNull(),
  imagePath: text('image_path'),
  aspectRatio: text('aspect_ratio').notNull(), // '16:9', '1:1', '4:5', '9:16'
  size: text('size').notNull(), // '4K', '2K', '1080p'
  status: text('status').notNull().default('pending'), // 'pending', 'generating', 'completed', 'failed'
  metaAdId: text('meta_ad_id'),
  errorMessage: text('error_message'),
  generationStartedAt: integer('generation_started_at', { mode: 'timestamp' }),
  generationCompletedAt: integer('generation_completed_at', {
    mode: 'timestamp',
  }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Type exports for use with Drizzle ORM
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Persona = typeof personas.$inferSelect;
export type NewPersona = typeof personas.$inferInsert;
export type Banner = typeof banners.$inferSelect;
export type NewBanner = typeof banners.$inferInsert;
