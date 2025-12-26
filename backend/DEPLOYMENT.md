# GameOn Backend - Render Deployment Guide

## Prerequisites

1. **MongoDB Database**: Set up a MongoDB Atlas cluster or any MongoDB cloud service
2. **Render Account**: Sign up at [render.com](https://render.com)

## Environment Variables

Set the following environment variables in your Render dashboard:

### Required Variables
- `DATABASE_URL`: Your MongoDB connection string (e.g., `mongodb+srv://username:password@cluster.mongodb.net/gameon`)
- `JWT_SECRET`: A secure random string for JWT token signing
- `NODE_ENV`: Set to `production`

### Optional Variables (if using these services)
- `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
- `CASHFREE_APP_ID`: Your Cashfree app ID
- `CASHFREE_SECRET`: Your Cashfree secret
- `CASHFREE_ENVIRONMENT`: `sandbox` or `production`

## Deployment Steps

### Option 1: Using render.yaml (Recommended)

1. Push your code to GitHub
2. Connect your GitHub repository to Render
3. Render will automatically detect the `render.yaml` file and configure the service
4. Set the required environment variables in the Render dashboard
5. Deploy!

### Option 2: Manual Setup

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the service:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid as needed)
4. Set environment variables in the dashboard
5. Deploy!

## Post-Deployment

1. Your backend will be available at: `https://your-service-name.onrender.com`
2. Test the health endpoint: `https://your-service-name.onrender.com/api/health`
3. Update your frontend configuration to use the new backend URL

## CORS Configuration

The backend is configured to allow CORS for:
- Development: `localhost:3000`, `localhost:3001`
- Production: Add your frontend domain to the `allowedOrigins` array in `server.js`

## Database Connection

The backend will automatically use the `DATABASE_URL` environment variable for MongoDB connection, with fallback to `MONGODB_URI` for backward compatibility.

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify your `DATABASE_URL` is correct
   - Ensure your MongoDB cluster allows connections from all IPs (0.0.0.0/0) or add Render's IP ranges

2. **CORS Errors**
   - Add your frontend domain to the CORS configuration in `server.js`
   - Ensure the frontend is making requests to the correct backend URL

3. **Environment Variables Not Loading**
   - Double-check variable names in the Render dashboard
   - Restart the service after adding new variables

### Logs

Check the Render dashboard logs for detailed error messages and debugging information.