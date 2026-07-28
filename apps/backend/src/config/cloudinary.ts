import { v2 as cloudinary } from 'cloudinary';
import { logger } from './logger';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export const CLOUDINARY_FOLDERS = {
  MEMBERS: 'mahallu/members',
  STUDENTS: 'mahallu/students',
  TEACHERS: 'mahallu/teachers',
  FAMILIES: 'mahallu/families',
  DOCUMENTS: 'mahallu/documents',
  CERTIFICATES: 'mahallu/certificates',
  RECEIPTS: 'mahallu/receipts',
  EVENTS: 'mahallu/events',
  CEMETERY: 'mahallu/cemetery',
  QR_CODES: 'mahallu/qr-codes',
};

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  fileName: string,
  resourceType: 'image' | 'raw' | 'auto' = 'image',
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: fileName,
        resource_type: resourceType,
        overwrite: true,
        quality: 'auto',
        fetch_format: 'auto',
      },
      (error, result) => {
        if (error || !result) {
          logger.error('Cloudinary upload error:', error);
          reject(error || new Error('Upload failed'));
        } else {
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      },
    );
    uploadStream.end(buffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
  }
}
