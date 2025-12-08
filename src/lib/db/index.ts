import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

let db: BetterSQLite3Database<typeof schema> | null = null;
let sqlite: Database.Database | null = null;

function getDbPath(): string {
  return process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'local.db');
}

function ensureDbDirectory(dbPath: string) {
  if (dbPath === ':memory:') return;
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (!db) {
    const dbPath = getDbPath();
    ensureDbDirectory(dbPath);
    sqlite = new Database(dbPath);
    db = drizzle(sqlite, { schema });

    // Enable foreign keys
    sqlite.pragma('foreign_keys = ON');

    // Create tables if they don't exist
    initializeSchema();
  }
  return db;
}

export function closeDb(): void {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    db = null;
  }
}

function initializeSchema(): void {
  if (!sqlite) return;

  // Create projects table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      product_url TEXT,
      product_name TEXT,
      product_category TEXT,
      target_info TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Create personas table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS personas (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      age_range TEXT,
      gender TEXT,
      occupation TEXT,
      income_level TEXT,
      interests TEXT,
      pain_points TEXT,
      buying_motivation TEXT,
      communication_style TEXT,
      created_at INTEGER NOT NULL
    )
  `);

  // Create banners table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS banners (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      persona_id TEXT REFERENCES personas(id) ON DELETE SET NULL,
      prompt TEXT NOT NULL,
      image_path TEXT,
      aspect_ratio TEXT NOT NULL,
      size TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      meta_ad_id TEXT,
      error_message TEXT,
      generation_started_at INTEGER,
      generation_completed_at INTEGER,
      created_at INTEGER NOT NULL
    )
  `);
}

export { schema };
