export type BannerStatus = 'pending' | 'generating' | 'completed' | 'failed';
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:5';
export type ImageSize = '4K' | '2K' | '1080p';
export type BannerStyle = 'professional' | 'casual' | 'minimal' | 'bold';

export interface Banner {
  id: string;
  projectId: string;
  personaId: string | null;
  prompt: string;
  imagePath: string | null;
  aspectRatio: AspectRatio;
  size: ImageSize;
  status: BannerStatus;
  metaAdId: string | null;
  errorMessage: string | null;
  generationStartedAt: Date | null;
  generationCompletedAt: Date | null;
  createdAt: Date;
}

export interface CreateBannerInput {
  projectId: string;
  personaId?: string;
  prompt: string;
  aspectRatio: AspectRatio;
  size: ImageSize;
}

export interface UpdateBannerInput {
  metaAdId?: string;
  status?: BannerStatus;
  imagePath?: string;
  errorMessage?: string;
  generationStartedAt?: Date;
  generationCompletedAt?: Date;
}

export interface GenerateBannerInput {
  personaIds: string[];
  settings: {
    aspectRatios: AspectRatio[];
    size: ImageSize;
    count: number;
    style: BannerStyle;
  };
}

export interface GenerationJob {
  id: string;
  projectId: string;
  personaIds: string[];
  settings: GenerateBannerInput['settings'];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}
