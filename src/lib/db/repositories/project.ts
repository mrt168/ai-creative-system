import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../schema';
import { projects, Project, NewProject } from '../schema';
import { CreateProjectInput, UpdateProjectInput } from '@/types/project';

export class ProjectRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async create(input: CreateProjectInput): Promise<Project> {
    const now = new Date();

    const newProject: NewProject = {
      name: input.name,
      description: input.description ?? null,
      productUrl: input.productUrl ?? null,
      productName: input.productName ?? null,
      productCategory: input.productCategory ?? null,
      targetInfo: input.targetInfo ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.db.insert(projects).values(newProject).returning();

    return result[0];
  }

  async findById(id: string): Promise<Project | null> {
    const result = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findAll(): Promise<Project[]> {
    return this.db.select().from(projects).orderBy(projects.createdAt);
  }

  async update(id: string, input: UpdateProjectInput): Promise<Project | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const updateData: Partial<NewProject> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.productUrl !== undefined) updateData.productUrl = input.productUrl;
    if (input.productName !== undefined) updateData.productName = input.productName;
    if (input.productCategory !== undefined) updateData.productCategory = input.productCategory;
    if (input.targetInfo !== undefined) {
      updateData.targetInfo = input.targetInfo;
    }

    const result = await this.db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, id))
      .returning();

    return result[0] ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) {
      return false;
    }

    await this.db.delete(projects).where(eq(projects.id, id));
    return true;
  }
}
