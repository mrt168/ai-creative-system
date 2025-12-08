import { BannerRepository } from '@/lib/db/repositories/banner';
import { ProjectRepository } from '@/lib/db/repositories/project';
import { PersonaRepository } from '@/lib/db/repositories/persona';
import { getDb, closeDb } from '@/lib/db';
import { randomUUID } from 'crypto';

describe('BannerRepository', () => {
  let bannerRepository: BannerRepository;
  let projectRepository: ProjectRepository;
  let personaRepository: PersonaRepository;
  let testProjectId: string;
  let testPersonaId: string;

  beforeEach(async () => {
    closeDb();
    process.env.DATABASE_URL = ':memory:';
    const db = getDb();
    bannerRepository = new BannerRepository(db);
    projectRepository = new ProjectRepository(db);
    personaRepository = new PersonaRepository(db);

    // Create test project and persona
    const project = await projectRepository.create({ name: 'Test Project' });
    testProjectId = project.id;

    const persona = await personaRepository.create({
      projectId: testProjectId,
      name: 'Test Persona',
    });
    testPersonaId = persona.id;
  });

  afterEach(() => {
    closeDb();
  });

  describe('create', () => {
    it('should create a new banner', async () => {
      const input = {
        projectId: testProjectId,
        personaId: testPersonaId,
        prompt: 'A beautiful product banner',
        aspectRatio: '16:9',
        size: '1080p',
      };

      const banner = await bannerRepository.create(input);

      expect(banner.id).toBeDefined();
      expect(banner.projectId).toBe(testProjectId);
      expect(banner.personaId).toBe(testPersonaId);
      expect(banner.prompt).toBe(input.prompt);
      expect(banner.aspectRatio).toBe(input.aspectRatio);
      expect(banner.size).toBe(input.size);
      expect(banner.status).toBe('pending');
      expect(banner.imagePath).toBeNull();
    });

    it('should create a banner without persona', async () => {
      const input = {
        projectId: testProjectId,
        prompt: 'A product banner without persona',
        aspectRatio: '1:1',
        size: '2K',
      };

      const banner = await bannerRepository.create(input);

      expect(banner.id).toBeDefined();
      expect(banner.personaId).toBeNull();
      expect(banner.status).toBe('pending');
    });
  });

  describe('findById', () => {
    it('should find a banner by id', async () => {
      const created = await bannerRepository.create({
        projectId: testProjectId,
        prompt: 'Find test',
        aspectRatio: '16:9',
        size: '1080p',
      });

      const found = await bannerRepository.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.prompt).toBe('Find test');
    });

    it('should return null for non-existent id', async () => {
      const found = await bannerRepository.findById(randomUUID());
      expect(found).toBeNull();
    });
  });

  describe('findByProjectId', () => {
    it('should return all banners for a project', async () => {
      await bannerRepository.create({
        projectId: testProjectId,
        prompt: 'Banner 1',
        aspectRatio: '16:9',
        size: '1080p',
      });
      await bannerRepository.create({
        projectId: testProjectId,
        prompt: 'Banner 2',
        aspectRatio: '1:1',
        size: '2K',
      });
      await bannerRepository.create({
        projectId: testProjectId,
        prompt: 'Banner 3',
        aspectRatio: '9:16',
        size: '4K',
      });

      const banners = await bannerRepository.findByProjectId(testProjectId);

      expect(banners.length).toBe(3);
    });

    it('should return empty array for project with no banners', async () => {
      const newProject = await projectRepository.create({ name: 'Empty Project' });
      const banners = await bannerRepository.findByProjectId(newProject.id);
      expect(banners).toEqual([]);
    });
  });

  describe('findByStatus', () => {
    it('should return banners with specified status', async () => {
      const banner1 = await bannerRepository.create({
        projectId: testProjectId,
        prompt: 'Banner 1',
        aspectRatio: '16:9',
        size: '1080p',
      });
      const banner2 = await bannerRepository.create({
        projectId: testProjectId,
        prompt: 'Banner 2',
        aspectRatio: '1:1',
        size: '2K',
      });

      // Update one banner to 'completed'
      await bannerRepository.update(banner1.id, {
        status: 'completed',
        imagePath: '/images/banner1.png',
      });

      const pendingBanners = await bannerRepository.findByStatus('pending');
      const completedBanners = await bannerRepository.findByStatus('completed');

      expect(pendingBanners.length).toBe(1);
      expect(pendingBanners[0].id).toBe(banner2.id);
      expect(completedBanners.length).toBe(1);
      expect(completedBanners[0].id).toBe(banner1.id);
    });
  });

  describe('update', () => {
    it('should update a banner', async () => {
      const created = await bannerRepository.create({
        projectId: testProjectId,
        prompt: 'Original prompt',
        aspectRatio: '16:9',
        size: '1080p',
      });

      const updated = await bannerRepository.update(created.id, {
        status: 'generating',
        generationStartedAt: new Date(),
      });

      expect(updated?.status).toBe('generating');
      expect(updated?.generationStartedAt).toBeDefined();
    });

    it('should update banner to completed with image path', async () => {
      const created = await bannerRepository.create({
        projectId: testProjectId,
        prompt: 'Test prompt',
        aspectRatio: '16:9',
        size: '1080p',
      });

      const updated = await bannerRepository.update(created.id, {
        status: 'completed',
        imagePath: '/generated/banner123.png',
        generationCompletedAt: new Date(),
      });

      expect(updated?.status).toBe('completed');
      expect(updated?.imagePath).toBe('/generated/banner123.png');
      expect(updated?.generationCompletedAt).toBeDefined();
    });

    it('should update banner to failed with error message', async () => {
      const created = await bannerRepository.create({
        projectId: testProjectId,
        prompt: 'Test prompt',
        aspectRatio: '16:9',
        size: '1080p',
      });

      const updated = await bannerRepository.update(created.id, {
        status: 'failed',
        errorMessage: 'API rate limit exceeded',
      });

      expect(updated?.status).toBe('failed');
      expect(updated?.errorMessage).toBe('API rate limit exceeded');
    });

    it('should return null when updating non-existent banner', async () => {
      const updated = await bannerRepository.update(randomUUID(), {
        status: 'completed',
      });
      expect(updated).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a banner', async () => {
      const created = await bannerRepository.create({
        projectId: testProjectId,
        prompt: 'To Delete',
        aspectRatio: '16:9',
        size: '1080p',
      });

      const deleted = await bannerRepository.delete(created.id);
      expect(deleted).toBe(true);

      const found = await bannerRepository.findById(created.id);
      expect(found).toBeNull();
    });

    it('should return false when deleting non-existent banner', async () => {
      const deleted = await bannerRepository.delete(randomUUID());
      expect(deleted).toBe(false);
    });
  });

  describe('cascade delete', () => {
    it('should delete banners when project is deleted', async () => {
      await bannerRepository.create({
        projectId: testProjectId,
        prompt: 'Banner 1',
        aspectRatio: '16:9',
        size: '1080p',
      });
      await bannerRepository.create({
        projectId: testProjectId,
        prompt: 'Banner 2',
        aspectRatio: '1:1',
        size: '2K',
      });

      await projectRepository.delete(testProjectId);

      const banners = await bannerRepository.findByProjectId(testProjectId);
      expect(banners).toEqual([]);
    });

    it('should set personaId to null when persona is deleted', async () => {
      const banner = await bannerRepository.create({
        projectId: testProjectId,
        personaId: testPersonaId,
        prompt: 'Banner with persona',
        aspectRatio: '16:9',
        size: '1080p',
      });

      await personaRepository.delete(testPersonaId);

      const found = await bannerRepository.findById(banner.id);
      expect(found).toBeDefined();
      expect(found?.personaId).toBeNull();
    });
  });

  describe('countByProjectId', () => {
    it('should return correct count of banners', async () => {
      await bannerRepository.create({
        projectId: testProjectId,
        prompt: 'Banner 1',
        aspectRatio: '16:9',
        size: '1080p',
      });
      await bannerRepository.create({
        projectId: testProjectId,
        prompt: 'Banner 2',
        aspectRatio: '1:1',
        size: '2K',
      });

      const count = await bannerRepository.countByProjectId(testProjectId);
      expect(count).toBe(2);
    });

    it('should return 0 for project with no banners', async () => {
      const newProject = await projectRepository.create({ name: 'Empty' });
      const count = await bannerRepository.countByProjectId(newProject.id);
      expect(count).toBe(0);
    });
  });
});
