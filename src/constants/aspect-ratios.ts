import { AspectRatio } from '@/types/banner';

export const ASPECT_RATIOS: Record<AspectRatio, { label: string; description: string; width: number; height: number }> = {
  '1:1': {
    label: 'Square (1:1)',
    description: 'Instagram Feed, Facebook Feed',
    width: 1080,
    height: 1080,
  },
  '16:9': {
    label: 'Landscape (16:9)',
    description: 'YouTube, Twitter/X, LinkedIn',
    width: 1920,
    height: 1080,
  },
  '9:16': {
    label: 'Portrait (9:16)',
    description: 'Instagram Stories, TikTok, Reels',
    width: 1080,
    height: 1920,
  },
  '4:5': {
    label: 'Vertical (4:5)',
    description: 'Instagram Feed (Vertical)',
    width: 1080,
    height: 1350,
  },
};

export const ASPECT_RATIO_OPTIONS = Object.entries(ASPECT_RATIOS).map(([value, config]) => ({
  value: value as AspectRatio,
  label: config.label,
  description: config.description,
}));
