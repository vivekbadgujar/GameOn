const cloudinary = require('cloudinary').v2;

const CLOUDINARY_PLACEHOLDERS = new Set([
  'your-cloud-name',
  'your-api-key',
  'your-api-secret'
]);

const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true
};

cloudinary.config(cloudinaryConfig);

const isCloudinaryConfigured = () => (
  Boolean(cloudinaryConfig.cloud_name) &&
  Boolean(cloudinaryConfig.api_key) &&
  Boolean(cloudinaryConfig.api_secret) &&
  !CLOUDINARY_PLACEHOLDERS.has(cloudinaryConfig.cloud_name) &&
  !CLOUDINARY_PLACEHOLDERS.has(cloudinaryConfig.api_key) &&
  !CLOUDINARY_PLACEHOLDERS.has(cloudinaryConfig.api_secret)
);

const ensureCloudinaryConfigured = () => {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
    );
  }
};

const uploadFromMulterFile = (file, options = {}) => {
  ensureCloudinaryConfigured();

  if (!file) {
    throw new Error('No file provided for upload.');
  }

  if (file.path) {
    return cloudinary.uploader.upload(file.path, options);
  }

  if (!file.buffer || !Buffer.isBuffer(file.buffer)) {
    throw new Error('Uploaded file is missing a readable buffer or file path.');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });

    uploadStream.end(file.buffer);
  });
};

const mapUploadResult = (result) => ({
  url: result.secure_url,
  publicId: result.public_id,
  width: result.width,
  height: result.height,
  format: result.format,
  duration: result.duration,
  bytes: result.bytes,
  resourceType: result.resource_type
});

const uploadImage = async (file, folder = 'gameon') => {
  try {
    const result = await uploadFromMulterFile(file, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 800, crop: 'limit' },
        { quality: 'auto:good' },
        { format: 'auto' }
      ]
    });

    return mapUploadResult(result);
  } catch (error) {
    console.error('Cloudinary image upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

const deleteImage = async (publicId) => {
  try {
    ensureCloudinaryConfigured();
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

const uploadVideo = async (file, folder = 'gameon/videos') => {
  try {
    const result = await uploadFromMulterFile(file, {
      folder,
      resource_type: 'video',
      transformation: [
        { width: 1920, height: 1080, crop: 'limit' },
        { quality: 'auto:good' },
        { format: 'auto' }
      ]
    });

    return mapUploadResult(result);
  } catch (error) {
    console.error('Cloudinary video upload error:', error);
    throw new Error(`Failed to upload video: ${error.message}`);
  }
};

const getOptimizedImageUrl = (publicId, options = {}) => {
  ensureCloudinaryConfigured();

  const {
    width = 800,
    height = 600,
    crop = 'fill',
    quality = 'auto:good',
    format = 'auto'
  } = options;

  return cloudinary.url(publicId, {
    width,
    height,
    crop,
    quality,
    format,
    secure: true
  });
};

module.exports = {
  cloudinary,
  deleteImage,
  ensureCloudinaryConfigured,
  getOptimizedImageUrl,
  isCloudinaryConfigured,
  uploadImage,
  uploadVideo
};
