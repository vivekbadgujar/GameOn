# MongoDB Connection Error Fix for Render Deployment

## Problem
Your Render deployment is showing this error:
```
MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
```

This means the application is trying to connect to a local MongoDB instance instead of your MongoDB Atlas cluster.

## Root Cause
The `DATABASE_URL` environment variable is not set in your Render dashboard, causing the application to fall back to the default localhost connection.

## Solution Steps

### 1. Set Environment Variables in Render Dashboard

Go to your Render service dashboard and add these environment variables:

**Required Variables:**
- `DATABASE_URL` = `mongodb+srv://vivekbadgujar:Vivek321@cluster0.squjxrk.mongodb.net/gameon?retryWrites=true&w=majority&appName=Cluster0`
- `JWT_SECRET` = `your-super-secure-jwt-secret-key-minimum-32-characters-change-this`
- `NODE_ENV` = `production`

**Optional Variables (if using these services):**
- `CLOUDINARY_CLOUD_NAME` = (your cloudinary cloud name)
- `CLOUDINARY_API_KEY` = (your cloudinary api key)
- `CLOUDINARY_API_SECRET` = (your cloudinary api secret)
- `RAZORPAY_KEY_ID` = (your razorpay key id)
- `RAZORPAY_KEY_SECRET` = (your razorpay key secret)

### 2. How to Add Environment Variables in Render

1. Go to your Render dashboard
2. Select your GameOn backend service
3. Go to the "Environment" tab
4. Click "Add Environment Variable"
5. Add each variable with its key and value
6. Click "Save Changes"

### 3. Redeploy Your Service

After adding the environment variables:
1. Go to the "Deploys" tab
2. Click "Deploy latest commit" or trigger a new deployment
3. Monitor the deployment logs to ensure MongoDB connects successfully

### 4. Verify the Fix

Once deployed, check your application logs. You should see:
```
🍃 Connected to MongoDB successfully
Database Name: gameon
Host: ac-k1xdtwe-shard-00-01.squjxrk.mongodb.net
```

Instead of the connection refused error.

### 5. Test Your API

Visit your deployed API endpoint (e.g., `https://your-app.onrender.com/api/health`) to verify it's working.

## Important Security Notes

1. **Never commit sensitive credentials to Git**
2. **Use strong, unique passwords for production**
3. **Consider rotating your MongoDB password periodically**
4. **Ensure your MongoDB Atlas IP whitelist includes 0.0.0.0/0 for Render**

## MongoDB Atlas Network Access

Make sure your MongoDB Atlas cluster allows connections from anywhere:
1. Go to MongoDB Atlas dashboard
2. Navigate to "Network Access"
3. Ensure you have an entry for `0.0.0.0/0` (Allow access from anywhere)
4. If not, click "Add IP Address" and add `0.0.0.0/0`

## Troubleshooting

If you still get connection errors after setting environment variables:

1. **Check the logs** in Render dashboard for specific error messages
2. **Verify environment variables** are correctly set (no extra spaces, correct values)
3. **Test locally** using the same environment variables
4. **Check MongoDB Atlas** network access and user permissions

## Test Script

You can run this test script locally to verify your connection string works:

```bash
cd backend
node ../test-mongodb-atlas.js
```

This should show "All tests passed!" if your MongoDB Atlas connection is working.