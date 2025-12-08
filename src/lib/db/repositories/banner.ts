import { eq, count } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../schema';
import { banners, Banner, NewBanner } from '../schema';
import { CreateBannerInput, UpdateBannerInput } from '@/types/banner';

export class BannerRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async create(input: CreateBannerInput): Promise<Banner> {
    const now = new Date();

    const newBanner: NewBanner = {
      projectId: input.projectId,
      personaId: input.personaId ?? null,
      prompt: input.prompt,
      imagePath: null,
      aspectRatio: input.aspectRatio,
      size: input.size,
      status: 'pending',
      metaAdId: null,
      errorMessage: null,
      generationStartedAt: null,
      generationCompletedAt: null,
      createdAt: now,
    };

    const result = await this.db.insert(banners).values(newBanner).returning();

    return result[0];
  }

  async findById(id: string): Promise<Banner | null> {
    const result = await this.db
      .select()
      .from(banners)
      .where(eq(banners.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findByProjectId(projectId: string): Promise<Banner[]> {
    return this.db
      .select()
      .from(banners)
      .where(eq(banners.projectId, projectId));
  }

  async findByStatus(status: string): Promise<Banner[]> {
    return this.db
      .select()
      .from(banners)
      .where(eq(banners.status, status));
  }

  async update(id: string, input: UpdateBannerInput): Promise<Banner | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const updateData: Partial<NewBanner> = {};

    if (input.imagePath !== undefined) updateData.imagePath = input.imagePath;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.metaAdId !== undefined) updateData.metaAdId = input.metaAdId;
    if (input.errorMessage !== undefined) updateData.errorMessage = input.errorMessage;
    if (input.generationStartedAt !== undefined) {
      updateData.generationStartedAt = input.generationStartedAt;
    }
    if (input.generationCompletedAt !== undefined) {
      updateData.generationCompletedAt = input.generationCompletedAt;
    }

    const result = await this.db
      .update(banners)
      .set(updateData)
      .where(eq(banners.id, id))
      .returning();

    return result[0] ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) {
      return false;
    }

    await this.db.delete(banners).where(eq(banners.id, id));
    return true;
  }

  async countByProjectId(projectId: string): Promise<number> {
    const result = await this.db
      .select({ count: count() })
      .from(banners)
      .where(eq(banners.projectId, projectId));

    return result[0]?.count ?? 0;
  }
}
