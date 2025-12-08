import { getDb, closeDb } from '@/lib/db';

describe('Database Connection', () => {
  afterEach(() => {
    closeDb();
  });

  it('should create database connection', () => {
    const db = getDb();
    expect(db).toBeDefined();
  });

  it('should return the same instance on multiple calls', () => {
    const db1 = getDb();
    const db2 = getDb();
    expect(db1).toBe(db2);
  });

  it('should be able to close and reconnect', () => {
    const db1 = getDb();
    closeDb();
    const db2 = getDb();
    expect(db2).toBeDefined();
    // After closing, a new instance should be created
    expect(db1).not.toBe(db2);
  });
});
