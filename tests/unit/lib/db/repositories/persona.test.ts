import { PersonaRepository } from '@/lib/db/repositories/persona';
import { ProjectRepository } from '@/lib/db/repositories/project';
import { getDb, closeDb } from '@/lib/db';
import { randomUUID } from 'crypto';

describe('PersonaRepository', () => {
  let personaRepository: PersonaRepository;
  let projectRepository: ProjectRepository;
  let testProjectId: string;

  beforeEach(async () => {
    closeDb();
    process.env.DATABASE_URL = ':memory:';
    const db = getDb();
    personaRepository = new PersonaRepository(db);
    projectRepository = new ProjectRepository(db);

    // Create a test project for personas
    const project = await projectRepository.create({ name: 'Test Project' });
    testProjectId = project.id;
  });

  afterEach(() => {
    closeDb();
  });

  describe('create', () => {
    it('should create a new persona', async () => {
      const input = {
        projectId: testProjectId,
        name: 'Test Persona',
        ageRange: '30-40',
        gender: '女性',
        occupation: '会社員',
        incomeLevel: '400-500万円',
        interests: ['スキンケア', 'ヨガ'],
        painPoints: ['乾燥肌', 'シワが気になる'],
        buyingMotivation: '美しくなりたい',
        communicationStyle: 'SNSの口コミを参考にする',
      };

      const persona = await personaRepository.create(input);

      expect(persona.id).toBeDefined();
      expect(persona.projectId).toBe(testProjectId);
      expect(persona.name).toBe(input.name);
      expect(persona.ageRange).toBe(input.ageRange);
      expect(persona.gender).toBe(input.gender);
      expect(persona.interests).toEqual(input.interests);
      expect(persona.painPoints).toEqual(input.painPoints);
    });

    it('should create a persona with minimal data', async () => {
      const input = {
        projectId: testProjectId,
        name: 'Minimal Persona',
      };

      const persona = await personaRepository.create(input);

      expect(persona.id).toBeDefined();
      expect(persona.name).toBe(input.name);
      expect(persona.ageRange).toBeNull();
      expect(persona.interests).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should find a persona by id', async () => {
      const created = await personaRepository.create({
        projectId: testProjectId,
        name: 'Find Test',
      });

      const found = await personaRepository.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Find Test');
    });

    it('should return null for non-existent id', async () => {
      const found = await personaRepository.findById(randomUUID());
      expect(found).toBeNull();
    });
  });

  describe('findByProjectId', () => {
    it('should return all personas for a project', async () => {
      await personaRepository.create({ projectId: testProjectId, name: 'Persona 1' });
      await personaRepository.create({ projectId: testProjectId, name: 'Persona 2' });
      await personaRepository.create({ projectId: testProjectId, name: 'Persona 3' });

      const personas = await personaRepository.findByProjectId(testProjectId);

      expect(personas.length).toBe(3);
    });

    it('should return empty array for project with no personas', async () => {
      const newProject = await projectRepository.create({ name: 'Empty Project' });
      const personas = await personaRepository.findByProjectId(newProject.id);
      expect(personas).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a persona', async () => {
      const created = await personaRepository.create({
        projectId: testProjectId,
        name: 'Original Name',
      });

      const updated = await personaRepository.update(created.id, {
        name: 'Updated Name',
        ageRange: '25-35',
      });

      expect(updated?.name).toBe('Updated Name');
      expect(updated?.ageRange).toBe('25-35');
    });

    it('should return null when updating non-existent persona', async () => {
      const updated = await personaRepository.update(randomUUID(), { name: 'Updated' });
      expect(updated).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a persona', async () => {
      const created = await personaRepository.create({
        projectId: testProjectId,
        name: 'To Delete',
      });

      const deleted = await personaRepository.delete(created.id);
      expect(deleted).toBe(true);

      const found = await personaRepository.findById(created.id);
      expect(found).toBeNull();
    });

    it('should return false when deleting non-existent persona', async () => {
      const deleted = await personaRepository.delete(randomUUID());
      expect(deleted).toBe(false);
    });
  });

  describe('cascade delete', () => {
    it('should delete personas when project is deleted', async () => {
      await personaRepository.create({ projectId: testProjectId, name: 'Persona 1' });
      await personaRepository.create({ projectId: testProjectId, name: 'Persona 2' });

      await projectRepository.delete(testProjectId);

      const personas = await personaRepository.findByProjectId(testProjectId);
      expect(personas).toEqual([]);
    });
  });
});
