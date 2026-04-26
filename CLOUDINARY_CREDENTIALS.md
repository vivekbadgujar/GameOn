# ⚠️ IMPORTANT: Cloudinary Credentials Setup

## Your Cloudinary Credentials:
```
CLOUDINARY_CLOUD_NAME=dapxrn7g3
CLOUDINARY_API_KEY=653297432828262
CLOUDINARY_API_SECRET=L0An1xcIe9PaPfM7jhjlpSHz_m0
```

## 🔧 Setup Instructions:

### 1. **Environment Variables (Production)**
Add these to your hosting platform (Vercel/Render/etc.):

```bash
CLOUDINARY_CLOUD_NAME=dapxrn7g3
CLOUDINARY_API_KEY=653297432828262
CLOUDINARY_API_SECRET=L0An1xcIe9PaPfM7jhjlpSHz_m0
```

### 2. **Local Development (.env)**
Add to your backend `.env` file:

```env
CLOUDINARY_CLOUD_NAME=dapxrn7g3
CLOUDINARY_API_KEY=653297432828262
CLOUDINARY_API_SECRET=L0An1xcIe9PaPfM7jhjlpSHz_m0
```

### 3. **Test the Configuration**
Run this to verify Cloudinary is working:

```bash
cd backend
node -e "
const { uploadImage } = require('./config/cloudinary');
const fs = require('fs');
const path = require('path');

// Create a test image buffer
const testImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');

const mockFile = {
  buffer: testImage,
  originalname: 'test.png',
  mimetype: 'image/png',
  size: testImage.length
};

uploadImage(mockFile, 'gameon/test')
  .then(result => {
    console.log('✅ Cloudinary upload successful!');
    console.log('URL:', result.url);
    console.log('Public ID:', result.publicId);
  })
  .catch(error => {
    console.error('❌ Cloudinary upload failed:', error.message);
  });
"
```

## 🎯 Next Steps:

1. **Set environment variables** in your hosting platform
2. **Deploy the code changes** (already completed in previous session)
3. **Test uploading images** in admin panel
4. **Verify images appear** in frontend with Cloudinary URLs

## 🔍 Verify URLs Should Look Like:
```
https://res.cloudinary.com/dapxrn7g3/image/upload/v1234567890/gameon/tournaments/thumbnails/abc123.jpg
https://res.cloudinary.com/dapxrn7g3/image/upload/v1234567890/gameon/tournaments/payment_qr/def456.jpg
```

## ⚠️ Security Notes:
- These are your **production credentials** - keep them secure
- Never commit them to git repositories
- Use environment variables only
- Your Cloudinary account: `dapxrn7g3`

Once you set these environment variables, the Cloudinary migration will be fully functional!
