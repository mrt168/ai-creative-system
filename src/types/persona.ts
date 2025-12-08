export interface Persona {
  id: string;
  projectId: string;
  name: string;
  ageRange: string | null;
  gender: string | null;
  occupation: string | null;
  incomeLevel: string | null;
  interests: string[];
  painPoints: string[];
  buyingMotivation: string | null;
  communicationStyle: string | null;
  createdAt: Date;
}

export interface CreatePersonaInput {
  projectId: string;
  name: string;
  ageRange?: string;
  gender?: string;
  occupation?: string;
  incomeLevel?: string;
  interests?: string[];
  painPoints?: string[];
  buyingMotivation?: string;
  communicationStyle?: string;
}

export interface UpdatePersonaInput extends Partial<Omit<CreatePersonaInput, 'projectId'>> {}

export interface GeneratePersonaInput {
  productName: string;
  productCategory: string;
  targetAge: string;
  targetGender: string;
  features: string[];
}
