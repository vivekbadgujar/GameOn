export const getAssetUrl = (filePath) => {
  if (!filePath) return '';
  
  // If it's already a full Cloudinary or other CDN URL, return as-is
  if (/^https?:\/\//i.test(filePath)) {
    return filePath;
  }
  
  // Handle data URLs
  if (filePath.startsWith('data:')) return filePath;

  const apiUrl = (process.env.REACT_APP_API_URL || 'https://api.gameonesport.xyz/api').replace(/\/$/, '');
  const baseUrl = apiUrl.replace(/\/api$/, ''); // e.g. https://api.gameonesport.xyz

  // Scrub any legacy localhost references
  let cleanPath = filePath.replace(/https?:\/\/localhost:\d+/g, '');

  // Strip any occurrence of the production base URL that may have been baked in,
  // so we always rebuild from scratch to avoid double-domain concatenation.
  cleanPath = cleanPath.replace(/https?:\/\/api\.gameonesport\.xyz/g, '');

  // If still a full URL (e.g. Cloudinary or other CDN) leave as-is
  if (cleanPath.startsWith('http')) return cleanPath;

  // Ensure leading slash for relative paths
  if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;

  return baseUrl + cleanPath;
};
