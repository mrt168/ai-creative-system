export interface Project {
  id: string;
  name: string;
  description: string | null;
  productUrl: string | null;
  productName: string | null;
  productCategory: string | null;
  targetInfo: TargetInfo | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TargetInfo {
  ageRange: string;
  gender: string;
  features: string[];
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  productUrl?: string;
  productName?: string;
  productCategory?: string;
  targetInfo?: TargetInfo;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {}
