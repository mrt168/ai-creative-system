// Template Types - テンプレート関連の型定義

import { FunnelType } from './strategy';
import { AppealAxisId } from '@/constants/appeal-axes';

// Target definition for strategy form
export interface TargetDefinition {
  name?: string;
  gender: 'male' | 'female' | 'all' | '';
  ageFrom: string;
  ageTo: string;
  issue: string;
}

// Strategy form settings (matches StrategyForm component state)
export interface StrategySettings {
  funnel: FunnelType;
  appealAxes: AppealAxisId[];
  targets: TargetDefinition[];
}

// Creative template for saving reusable form configurations
export interface CreativeTemplate {
  id: string;
  projectId: string;
  name: string;
  strategySettings: StrategySettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTemplateInput {
  projectId: string;
  name: string;
  strategySettings: StrategySettings;
}

export interface UpdateTemplateInput {
  name?: string;
  strategySettings?: StrategySettings;
}
