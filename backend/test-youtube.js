/**
 * Test YouTube URL extraction
 */

// Simulate the extraction function
function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  
  console.log('Extracting YouTube ID from URL:', url);
  
  // Clean the URL
  url = url.trim();
  
  // Handle different YouTube URL formats
  const patterns = [
    // Standard watch URLs
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    // Short URLs
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    // Embed URLs
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    // Old format
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    // Watch URLs with additional parameters
    /youtube\.com\/watch\?.*[&?]v=([a-zA-Z0-9_-]{11})/,
    // Mobile URLs
    /(?:m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1] && match[1].length === 11) {
      console.log('Successfully extracted YouTube ID:', match[1]);
      return match[1];
    }
  }
  
  console.log('Failed to extract YouTube ID from URL:', url);
  return null;
}

// Test URLs
const testUrls = [
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://youtu.be/dQw4w9WgXcQ',
  'https://youtube.com/watch?v=dQw4w9WgXcQ',
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s',
  'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
  'youtube.com/watch?v=dQw4w9WgXcQ',
  'youtu.be/dQw4w9WgXcQ'
];

console.log('Testing YouTube URL extraction:');
console.log('================================');

testUrls.forEach(url => {
  const id = extractYouTubeId(url);
  console.log(`URL: ${url}`);
  console.log(`ID: ${id}`);
  console.log(`Valid: ${id !== null && id.length === 11}`);
  console.log('---');
});