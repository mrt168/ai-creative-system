import { ProjectRepository } from '@/lib/db/repositories/project';
import { getDb, closeDb } from '@/lib/db';
import { randomUUID } from 'crypto';

describe('ProjectRepository', () => {
  let repository: ProjectRepository;

  beforeEach(() => {
    // Close any existing connection first
    closeDb();
    // Use in-memory database for testing
    process.env.DATABASE_URL = ':memory:';
    repository = new ProjectRepository(getDb());
  });

  afterEach(() => {
    closeDb();
  });

  describe('create', () => {
    it('should create a new project', async () => {
      const input = {
        name: 'Test Project',
        description: 'Test Description',
        productUrl: 'https://example.com',
        productName: 'Test Product',
        productCategory: 'Test Category',
      };

      const project = await repository.create(input);

      expect(project.id).toBeDefined();
      expect(project.name).toBe(input.name);
      expect(project.description).toBe(input.description);
      expect(project.productUrl).toBe(input.productUrl);
      expect(project.productName).toBe(input.productName);
      expect(project.productCategory).toBe(input.productCategory);
      expect(project.createdAt).toBeDefined();
      expect(project.updatedAt).toBeDefined();
    });

    it('should create a project with minimal data', async () => {
      const input = {
        name: 'Minimal Project',
      };

      const project = await repository.create(input);

      expect(project.id).toBeDefined();
      expect(project.name).toBe(input.name);
      expect(project.description).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find a project by id', async () => {
      const created = await repository.create({ name: 'Find Test' });
      const found = await repository.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Find Test');
    });

    it('should return null for non-existent id', async () => {
      const found = await repository.findById(randomUUID());
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all projects', async () => {
      await repository.create({ name: 'Project 1' });
      await repository.create({ name: 'Project 2' });
      await repository.create({ name: 'Project 3' });

      const projects = await repository.findAll();

      expect(projects.length).toBe(3);
    });

    it('should return empty array when no projects exist', async () => {
      const projects = await repository.findAll();
      expect(projects).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const created = await repository.create({ name: 'Original Name' });
      const updated = await repository.update(created.id, { name: 'Updated Name' });

      expect(updated?.name).toBe('Updated Name');
      expect(updated?.id).toBe(created.id);
    });

    it('should return null when updating non-existent project', async () => {
      const updated = await repository.update(randomUUID(), { name: 'Updated' });
      expect(updated).toBeNull();
    });

    it('should update only specified fields', async () => {
      const created = await repository.create({
        name: 'Original',
        description: 'Original Desc',
      });
      const updated = await repository.update(created.id, { name: 'New Name' });

      expect(updated?.name).toBe('New Name');
      expect(updated?.description).toBe('Original Desc');
    });
  });

  describe('delete', () => {
    it('should delete a project', async () => {
      const created = await repository.create({ name: 'To Delete' });
      const deleted = await repository.delete(created.id);

      expect(deleted).toBe(true);

      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });

    it('should return false when deleting non-existent project', async () => {
      const deleted = await repository.delete(randomUUID());
      expect(deleted).toBe(false);
    });
  });
});
