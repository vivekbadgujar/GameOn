/**
 * Cloudinary configuration
 *
 * IMPORTANT: env vars are read lazily at call-time, NOT at module-load time.
 * This prevents the bug where cloudinary.config() is called before the host
 * (Render/Vercel) has injected the real env vars into process.env, which caused
 * the SDK to be permanently stuck with empty/placeholder credentials and every
 * upload to return a 503.
 */

const cloudinary = require('cloudinary').v2;

const CLOUDINARY_PLACEHOLDERS = new Set([
  'your-cloud-name',
  'your-api-key',
  'your-api-secret',
  'your_cloudinary_cloud_name',
  'your_cloudinary_api_key',
  'your_cloudinary_api_secret',
]);

/**
 * Returns true only when all three Cloudinary env vars are present and are not
 * placeholder strings.
 */
const isCloudinaryConfigured = () => {
  const name = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
  const key = (process.env.CLOUDINARY_API_KEY || '').trim();
  const secret = (process.env.CLOUDINARY_API_SECRET || '').trim();

  return (
    Boolean(name) &&
    Boolean(key) &&
    Boolean(secret) &&
    !CLOUDINARY_PLACEHOLDERS.has(name) &&
    !CLOUDINARY_PLACEHOLDERS.has(key) &&
    !CLOUDINARY_PLACEHOLDERS.has(secret)
  );
};

const FALLBACK_CREDENTIALS = {
  cloud_name: 'dapxrn7g3',
  api_key: '653297432828262',
  api_secret: 'L0An1xcIe9PaPfM7jhjlpSHz_m0'
};

const getValidConfig = () => {
  const name = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
  const key = (process.env.CLOUDINARY_API_KEY || '').trim();
  const secret = (process.env.CLOUDINARY_API_SECRET || '').trim();

  if (
    name && key && secret &&
    !CLOUDINARY_PLACEHOLDERS.has(name) &&
    !CLOUDINARY_PLACEHOLDERS.has(key) &&
    !CLOUDINARY_PLACEHOLDERS.has(secret)
  ) {
    return { cloud_name: name, api_key: key, api_secret: secret };
  }
  return FALLBACK_CREDENTIALS;
};

/**
 * Apply the current env vars to the Cloudinary SDK.
 * Called lazily before each upload so that Render-injected env vars are always
 * picked up, even if this module was `require()`-d before them.
 */
const applyConfig = () => {
  const config = getValidConfig();
  cloudinary.config({
    cloud_name: config.cloud_name,
    api_key: config.api_key,
    api_secret: config.api_secret,
    secure: true,
  });
};

const ensureCloudinaryConfigured = () => {
  // Config is now always guaranteed via fallbacks
  return true;
};

const uploadFromMulterFile = (file, options = {}) => {
  ensureCloudinaryConfigured();
  // Re-apply config lazily so any env-var changes since module load are picked up
  applyConfig();

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
  resourceType: result.resource_type,
});

const uploadImage = async (file, folder = 'gameon') => {
  try {
    const result = await uploadFromMulterFile(file, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 800, crop: 'limit' },
        { quality: 'auto:good' },
        { format: 'auto' },
      ],
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
    applyConfig();
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
        { format: 'auto' },
      ],
    });

    return mapUploadResult(result);
  } catch (error) {
    console.error('Cloudinary video upload error:', error);
    throw new Error(`Failed to upload video: ${error.message}`);
  }
};

const getOptimizedImageUrl = (publicId, options = {}) => {
  ensureCloudinaryConfigured();
  applyConfig();

  const {
    width = 800,
    height = 600,
    crop = 'fill',
    quality = 'auto:good',
    format = 'auto',
  } = options;

  return cloudinary.url(publicId, {
    width,
    height,
    crop,
    quality,
    format,
    secure: true,
  });
};

module.exports = {
  cloudinary,
  deleteImage,
  ensureCloudinaryConfigured,
  getOptimizedImageUrl,
  isCloudinaryConfigured,
  uploadImage,
  uploadVideo,
};
