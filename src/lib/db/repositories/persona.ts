import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../schema';
import { personas, Persona, NewPersona } from '../schema';
import { CreatePersonaInput, UpdatePersonaInput } from '@/types/persona';

export class PersonaRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async create(input: CreatePersonaInput): Promise<Persona> {
    const now = new Date();

    const newPersona: NewPersona = {
      projectId: input.projectId,
      name: input.name,
      ageRange: input.ageRange ?? null,
      gender: input.gender ?? null,
      occupation: input.occupation ?? null,
      incomeLevel: input.incomeLevel ?? null,
      interests: input.interests ?? [],
      painPoints: input.painPoints ?? [],
      buyingMotivation: input.buyingMotivation ?? null,
      communicationStyle: input.communicationStyle ?? null,
      createdAt: now,
    };

    const result = await this.db.insert(personas).values(newPersona).returning();

    return result[0];
  }

  async findById(id: string): Promise<Persona | null> {
    const result = await this.db
      .select()
      .from(personas)
      .where(eq(personas.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findByProjectId(projectId: string): Promise<Persona[]> {
    return this.db
      .select()
      .from(personas)
      .where(eq(personas.projectId, projectId));
  }

  async update(id: string, input: UpdatePersonaInput): Promise<Persona | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const updateData: Partial<NewPersona> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.ageRange !== undefined) updateData.ageRange = input.ageRange;
    if (input.gender !== undefined) updateData.gender = input.gender;
    if (input.occupation !== undefined) updateData.occupation = input.occupation;
    if (input.incomeLevel !== undefined) updateData.incomeLevel = input.incomeLevel;
    if (input.interests !== undefined) {
      updateData.interests = input.interests;
    }
    if (input.painPoints !== undefined) {
      updateData.painPoints = input.painPoints;
    }
    if (input.buyingMotivation !== undefined) {
      updateData.buyingMotivation = input.buyingMotivation;
    }
    if (input.communicationStyle !== undefined) {
      updateData.communicationStyle = input.communicationStyle;
    }

    const result = await this.db
      .update(personas)
      .set(updateData)
      .where(eq(personas.id, id))
      .returning();

    return result[0] ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) {
      return false;
    }

    await this.db.delete(personas).where(eq(personas.id, id));
    return true;
  }
}
