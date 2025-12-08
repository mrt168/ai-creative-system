import { ProjectRepository } from '@/lib/db/repositories/project';
import { PersonaRepository } from '@/lib/db/repositories/persona';
import { BannerRepository } from '@/lib/db/repositories/banner';
import { getDb, closeDb } from '@/lib/db';

describe('API Workflow Integration Tests', () => {
  let projectRepo: ProjectRepository;
  let personaRepo: PersonaRepository;
  let bannerRepo: BannerRepository;

  beforeEach(() => {
    closeDb();
    process.env.DATABASE_URL = ':memory:';
    const db = getDb();
    projectRepo = new ProjectRepository(db);
    personaRepo = new PersonaRepository(db);
    bannerRepo = new BannerRepository(db);
  });

  afterEach(() => {
    closeDb();
  });

  describe('Complete Workflow: Project -> Persona -> Banner', () => {
    it('should create a complete workflow from project to banner', async () => {
      // Step 1: Create a project
      const project = await projectRepo.create({
        name: 'Summer Campaign',
        description: 'Summer skincare promotion',
        productName: 'Moisture Rich Cream',
        productCategory: 'Beauty & Cosmetics',
        productUrl: 'https://example.com/product',
      });

      expect(project).toBeDefined();
      expect(project.id).toBeDefined();
      expect(project.name).toBe('Summer Campaign');

      // Step 2: Create personas for the project
      const persona1 = await personaRepo.create({
        projectId: project.id,
        name: 'Working Professional',
        ageRange: '25-34',
        gender: 'Female',
        occupation: 'Office Worker',
        interests: ['Skincare', 'Fashion', 'Wellness'],
        painPoints: ['Dry skin', 'Busy lifestyle'],
        buyingMotivation: 'Wants quick and effective skincare solutions',
      });

      const persona2 = await personaRepo.create({
        projectId: project.id,
        name: 'Stay-at-home Parent',
        ageRange: '30-40',
        gender: 'Female',
        occupation: 'Homemaker',
        interests: ['Family', 'Health', 'Self-care'],
        painPoints: ['Limited time for self-care', 'Budget conscious'],
        buyingMotivation: 'Seeks affordable quality products',
      });

      expect(persona1).toBeDefined();
      expect(persona2).toBeDefined();

      // Verify personas are linked to project
      const projectPersonas = await personaRepo.findByProjectId(project.id);
      expect(projectPersonas).toHaveLength(2);

      // Step 3: Create banners for personas
      const banner1 = await bannerRepo.create({
        projectId: project.id,
        personaId: persona1.id,
        prompt: 'Professional woman enjoying skincare routine',
        aspectRatio: '1:1',
        size: 'medium',
      });

      const banner2 = await bannerRepo.create({
        projectId: project.id,
        personaId: persona2.id,
        prompt: 'Family-oriented mother with natural skincare',
        aspectRatio: '16:9',
        size: 'large',
      });

      expect(banner1).toBeDefined();
      expect(banner2).toBeDefined();
      expect(banner1.status).toBe('pending');

      // Verify banners are linked to project
      const projectBanners = await bannerRepo.findByProjectId(project.id);
      expect(projectBanners).toHaveLength(2);

      // Step 4: Update banner status (simulating generation)
      const updatedBanner = await bannerRepo.update(banner1.id, {
        status: 'completed',
        imagePath: '/generated/banner-1.png',
        generationCompletedAt: new Date(),
      });

      expect(updatedBanner?.status).toBe('completed');
      expect(updatedBanner?.imagePath).toBe('/generated/banner-1.png');

      // Step 5: Verify counts
      const personaCount = await personaRepo.findByProjectId(project.id);
      const bannerCount = await bannerRepo.countByProjectId(project.id);
      const completedBanners = await bannerRepo.findByStatus('completed');

      expect(personaCount).toHaveLength(2);
      expect(bannerCount).toBe(2);
      expect(completedBanners).toHaveLength(1);
    });

    it('should handle project deletion cascade correctly', async () => {
      // Create project with personas and banners
      const project = await projectRepo.create({
        name: 'Test Project',
        productName: 'Test Product',
        productCategory: 'Test Category',
      });

      const persona = await personaRepo.create({
        projectId: project.id,
        name: 'Test Persona',
        interests: [],
        painPoints: [],
      });

      const banner = await bannerRepo.create({
        projectId: project.id,
        personaId: persona.id,
        prompt: 'Test prompt',
        aspectRatio: '1:1',
        size: 'small',
      });

      // Verify all created
      expect(await projectRepo.findById(project.id)).toBeDefined();
      expect(await personaRepo.findById(persona.id)).toBeDefined();
      expect(await bannerRepo.findById(banner.id)).toBeDefined();

      // Delete project
      const deleted = await projectRepo.delete(project.id);
      expect(deleted).toBe(true);

      // Project should be deleted
      expect(await projectRepo.findById(project.id)).toBeNull();
    });

    it('should update persona and reflect in related queries', async () => {
      const project = await projectRepo.create({
        name: 'Update Test Project',
        productName: 'Test Product',
        productCategory: 'Test Category',
      });

      const persona = await personaRepo.create({
        projectId: project.id,
        name: 'Original Name',
        ageRange: '20-30',
        interests: ['Interest 1'],
        painPoints: ['Pain 1'],
      });

      // Update persona
      const updatedPersona = await personaRepo.update(persona.id, {
        name: 'Updated Name',
        ageRange: '25-35',
        interests: ['Interest 1', 'Interest 2', 'Interest 3'],
        painPoints: ['Pain 1', 'Pain 2'],
        buyingMotivation: 'New motivation',
      });

      expect(updatedPersona).toBeDefined();
      expect(updatedPersona?.name).toBe('Updated Name');
      expect(updatedPersona?.ageRange).toBe('25-35');
      expect(updatedPersona?.interests).toHaveLength(3);
      expect(updatedPersona?.painPoints).toHaveLength(2);
      expect(updatedPersona?.buyingMotivation).toBe('New motivation');

      // Verify through findByProjectId
      const projectPersonas = await personaRepo.findByProjectId(project.id);
      expect(projectPersonas[0].name).toBe('Updated Name');
    });

    it('should handle banner status transitions correctly', async () => {
      const project = await projectRepo.create({
        name: 'Status Test Project',
        productName: 'Test Product',
        productCategory: 'Test Category',
      });

      const banner = await bannerRepo.create({
        projectId: project.id,
        prompt: 'Test prompt',
        aspectRatio: '1:1',
        size: 'medium',
      });

      // Initial status should be pending
      expect(banner.status).toBe('pending');

      // Transition to processing
      const processingBanner = await bannerRepo.update(banner.id, {
        status: 'processing',
        generationStartedAt: new Date(),
      });
      expect(processingBanner?.status).toBe('processing');

      // Transition to completed
      const completedBanner = await bannerRepo.update(banner.id, {
        status: 'completed',
        imagePath: '/generated/test-banner.png',
        generationCompletedAt: new Date(),
      });
      expect(completedBanner?.status).toBe('completed');
      expect(completedBanner?.imagePath).toBe('/generated/test-banner.png');

      // Verify status filtering
      const completedBanners = await bannerRepo.findByStatus('completed');
      expect(completedBanners).toHaveLength(1);
      expect(completedBanners[0].id).toBe(banner.id);
    });

    it('should handle failed banner generation', async () => {
      const project = await projectRepo.create({
        name: 'Failure Test Project',
        productName: 'Test Product',
        productCategory: 'Test Category',
      });

      const banner = await bannerRepo.create({
        projectId: project.id,
        prompt: 'Test prompt',
        aspectRatio: '1:1',
        size: 'medium',
      });

      // Update to processing
      await bannerRepo.update(banner.id, {
        status: 'processing',
        generationStartedAt: new Date(),
      });

      // Simulate failure
      const failedBanner = await bannerRepo.update(banner.id, {
        status: 'failed',
        errorMessage: 'Generation failed: API rate limit exceeded',
        generationCompletedAt: new Date(),
      });

      expect(failedBanner?.status).toBe('failed');
      expect(failedBanner?.errorMessage).toContain('rate limit');
      expect(failedBanner?.imagePath).toBeNull();

      // Verify failed banners can be queried
      const failedBanners = await bannerRepo.findByStatus('failed');
      expect(failedBanners).toHaveLength(1);
    });
  });

  describe('Multiple Projects Isolation', () => {
    it('should keep data isolated between projects', async () => {
      // Create two projects
      const project1 = await projectRepo.create({
        name: 'Project 1',
        productName: 'Product 1',
        productCategory: 'Category 1',
      });

      const project2 = await projectRepo.create({
        name: 'Project 2',
        productName: 'Product 2',
        productCategory: 'Category 2',
      });

      // Create personas for each project
      await personaRepo.create({
        projectId: project1.id,
        name: 'Persona for Project 1',
        interests: [],
        painPoints: [],
      });

      await personaRepo.create({
        projectId: project2.id,
        name: 'Persona 1 for Project 2',
        interests: [],
        painPoints: [],
      });

      await personaRepo.create({
        projectId: project2.id,
        name: 'Persona 2 for Project 2',
        interests: [],
        painPoints: [],
      });

      // Verify isolation
      const project1Personas = await personaRepo.findByProjectId(project1.id);
      const project2Personas = await personaRepo.findByProjectId(project2.id);

      expect(project1Personas).toHaveLength(1);
      expect(project2Personas).toHaveLength(2);
      expect(project1Personas[0].name).toContain('Project 1');
      expect(project2Personas.every(p => p.name.includes('Project 2'))).toBe(true);
    });
  });
});
