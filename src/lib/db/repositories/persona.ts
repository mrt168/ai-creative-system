import { eq } from 'drizzle-orm';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { randomUUID } from 'crypto';
import * as schema from '../schema';
import { personas, Persona, NewPersona } from '../schema';
import { CreatePersonaInput, UpdatePersonaInput } from '@/types/persona';

export class PersonaRepository {
  constructor(private db: BetterSQLite3Database<typeof schema>) {}

  async create(input: CreatePersonaInput): Promise<Persona> {
    const now = new Date();
    const id = randomUUID();

    const newPersona: NewPersona = {
      id,
      projectId: input.projectId,
      name: input.name,
      ageRange: input.ageRange ?? null,
      gender: input.gender ?? null,
      occupation: input.occupation ?? null,
      incomeLevel: input.incomeLevel ?? null,
      interests: input.interests ? JSON.stringify(input.interests) : null,
      painPoints: input.painPoints ? JSON.stringify(input.painPoints) : null,
      buyingMotivation: input.buyingMotivation ?? null,
      communicationStyle: input.communicationStyle ?? null,
      createdAt: now,
    };

    await this.db.insert(personas).values(newPersona);

    return this.findById(id) as Promise<Persona>;
  }

  async findById(id: string): Promise<Persona | null> {
    const result = await this.db
      .select()
      .from(personas)
      .where(eq(personas.id, id))
      .limit(1);

    if (!result[0]) {
      return null;
    }

    return this.transformPersona(result[0]);
  }

  async findByProjectId(projectId: string): Promise<Persona[]> {
    const results = await this.db
      .select()
      .from(personas)
      .where(eq(personas.projectId, projectId));

    return results.map((p) => this.transformPersona(p));
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
      updateData.interests = JSON.stringify(input.interests);
    }
    if (input.painPoints !== undefined) {
      updateData.painPoints = JSON.stringify(input.painPoints);
    }
    if (input.buyingMotivation !== undefined) {
      updateData.buyingMotivation = input.buyingMotivation;
    }
    if (input.communicationStyle !== undefined) {
      updateData.communicationStyle = input.communicationStyle;
    }

    await this.db
      .update(personas)
      .set(updateData)
      .where(eq(personas.id, id));

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) {
      return false;
    }

    await this.db.delete(personas).where(eq(personas.id, id));
    return true;
  }

  private transformPersona(raw: typeof personas.$inferSelect): Persona {
    return {
      ...raw,
      interests: raw.interests ? JSON.parse(raw.interests) : [],
      painPoints: raw.painPoints ? JSON.parse(raw.painPoints) : [],
    } as Persona;
  }
}
