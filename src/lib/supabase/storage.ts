import { getSupabase } from './client';
import { randomUUID } from 'crypto';

const BUCKET_NAME = 'banners';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload image buffer to Supabase Storage
 */
export async function uploadImage(
  buffer: Buffer,
  mimeType: string
): Promise<UploadResult> {
  try {
    const supabase = getSupabase();

    // Generate unique filename
    const extension = getExtensionFromMimeType(mimeType);
    const filename = `banner_${randomUUID()}${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

    return { success: true, url: publicUrl };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
    console.error('Upload error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Check if running in serverless environment (Vercel)
 */
export function isServerlessEnvironment(): boolean {
  return process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;
}

function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExtension: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };

  return mimeToExtension[mimeType] || '.png';
}
