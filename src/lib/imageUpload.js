import { supabaseAdmin } from './supabase';
import sharp from 'sharp';

export async function uploadImage(file, boardCode, postNumber) {
  try {
    // Check file size (5MB = 5 * 1024 * 1024 bytes)
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeBytes) {
      throw new Error(`File size exceeds 5MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate thumbnail
    const thumbnailBuffer = await sharp(buffer)
      .resize(250, 250, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = originalName.split('.').pop();
    const filename = `${timestamp}_${postNumber}.${extension}`;
    const thumbnailFilename = `thumb_${filename}`;
    
    // Upload original image
    const { data: imageData, error: imageError } = await supabaseAdmin.storage
      .from('images')
      .upload(`${boardCode}/${filename}`, buffer, {
        contentType: file.type,
        cacheControl: '31536000'
      });
    
    if (imageError) throw imageError;
    
    // Upload thumbnail
    const { data: thumbData, error: thumbError } = await supabaseAdmin.storage
      .from('images')
      .upload(`${boardCode}/thumbs/${thumbnailFilename}`, thumbnailBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '31536000'
      });
    
    if (thumbError) throw thumbError;
    
    // Get public URLs
    const { data: imageUrl } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(`${boardCode}/${filename}`);
    
    const { data: thumbnailUrl } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(`${boardCode}/thumbs/${thumbnailFilename}`);
    
    return {
      imageUrl: imageUrl.publicUrl,
      thumbnailUrl: thumbnailUrl.publicUrl,
      imageName: originalName,
      fileSize: file.size
    };
    
  } catch (error) {
    console.error('Image upload error:', error);
    throw error; // Re-throw to preserve the original error message
  }
}