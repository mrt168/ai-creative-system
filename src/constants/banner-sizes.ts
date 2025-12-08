import { ImageSize, BannerStyle } from '@/types/banner';

export const IMAGE_SIZES: Record<ImageSize, { label: string; description: string }> = {
  '4K': {
    label: '4K (Ultra HD)',
    description: 'Maximum quality, best for large displays',
  },
  '2K': {
    label: '2K (QHD)',
    description: 'High quality, good balance of size and quality',
  },
  '1080p': {
    label: '1080p (Full HD)',
    description: 'Standard quality, fastest generation',
  },
};

export const IMAGE_SIZE_OPTIONS = Object.entries(IMAGE_SIZES).map(([value, config]) => ({
  value: value as ImageSize,
  label: config.label,
  description: config.description,
}));

export const BANNER_STYLES: Record<BannerStyle, { label: string; description: string }> = {
  professional: {
    label: 'Professional',
    description: 'Clean, corporate look with minimal design',
  },
  casual: {
    label: 'Casual',
    description: 'Friendly, approachable design',
  },
  minimal: {
    label: 'Minimal',
    description: 'Simple, focused on key message',
  },
  bold: {
    label: 'Bold',
    description: 'Eye-catching, vibrant colors',
  },
};

export const BANNER_STYLE_OPTIONS = Object.entries(BANNER_STYLES).map(([value, config]) => ({
  value: value as BannerStyle,
  label: config.label,
  description: config.description,
}));

export const DEFAULT_GENERATION_COUNT = 5;
export const MAX_GENERATION_COUNT = 20;
export const MIN_GENERATION_COUNT = 1;
