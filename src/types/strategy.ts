// Funnel types for marketing stages
export type FunnelType = 'awareness' | 'consideration' | 'conversion' | 'retention';

// Appeal axis ID type (references constants/appeal-axes.ts)
export type AppealAxisId = string;

export interface StrategyPersona {
  id: string;
  projectId: string;
  name: string;
  gender: string | null;
  ageFrom: number | null;
  ageTo: number | null;
  issue: string | null;
  funnel: FunnelType | null;
  appealAxes: AppealAxisId[];
  createdAt: Date;
}

export interface CreateStrategyPersonaInput {
  projectId: string;
  name: string;
  gender?: string;
  ageFrom?: number;
  ageTo?: number;
  issue?: string;
  funnel?: FunnelType;
  appealAxes?: AppealAxisId[];
}

export interface UpdateStrategyPersonaInput {
  name?: string;
  gender?: string;
  ageFrom?: number;
  ageTo?: number;
  issue?: string;
  funnel?: FunnelType;
  appealAxes?: AppealAxisId[];
}
