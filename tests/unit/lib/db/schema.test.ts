import { projects, personas, banners } from '@/lib/db/schema';
import { getTableName } from 'drizzle-orm';

describe('Database Schema', () => {
  describe('projects table', () => {
    it('should have correct table name', () => {
      expect(getTableName(projects)).toBe('projects');
    });

    it('should have required columns', () => {
      const columnNames = Object.keys(projects);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('description');
      expect(columnNames).toContain('productUrl');
      expect(columnNames).toContain('productName');
      expect(columnNames).toContain('productCategory');
      expect(columnNames).toContain('targetInfo');
      expect(columnNames).toContain('createdAt');
      expect(columnNames).toContain('updatedAt');
    });
  });

  describe('personas table', () => {
    it('should have correct table name', () => {
      expect(getTableName(personas)).toBe('personas');
    });

    it('should have required columns', () => {
      const columnNames = Object.keys(personas);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('projectId');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('ageRange');
      expect(columnNames).toContain('gender');
      expect(columnNames).toContain('occupation');
      expect(columnNames).toContain('incomeLevel');
      expect(columnNames).toContain('interests');
      expect(columnNames).toContain('painPoints');
      expect(columnNames).toContain('buyingMotivation');
      expect(columnNames).toContain('communicationStyle');
      expect(columnNames).toContain('createdAt');
    });

    it('should have projectId as foreign key reference', () => {
      expect(personas.projectId).toBeDefined();
    });
  });

  describe('banners table', () => {
    it('should have correct table name', () => {
      expect(getTableName(banners)).toBe('banners');
    });

    it('should have required columns', () => {
      const columnNames = Object.keys(banners);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('projectId');
      expect(columnNames).toContain('personaId');
      expect(columnNames).toContain('prompt');
      expect(columnNames).toContain('imagePath');
      expect(columnNames).toContain('aspectRatio');
      expect(columnNames).toContain('size');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('metaAdId');
      expect(columnNames).toContain('errorMessage');
      expect(columnNames).toContain('generationStartedAt');
      expect(columnNames).toContain('generationCompletedAt');
      expect(columnNames).toContain('createdAt');
    });

    it('should have projectId as foreign key reference', () => {
      expect(banners.projectId).toBeDefined();
    });

    it('should have personaId as foreign key reference', () => {
      expect(banners.personaId).toBeDefined();
    });
  });
});
