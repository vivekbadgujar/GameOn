# Vercel Deployment Setup for GameOn Monorepo

This monorepo contains three separate applications that deploy independently to Vercel.

## Project Structure

```
GameOn-Platform/
├── admin-panel/          → Admin dashboard (Next.js SSR)
├── backend/              → Express.js API
├── frontend/             → Next.js frontend application
└── mobile/               → React Native (not deployed to Vercel)
```

## Vercel Project Configurations

### 1. Admin Panel (`admin-panel/`)

**Type:** Next.js Server-Side Rendered (SSR)

**Vercel Dashboard Settings:**
- **Root Directory:** `admin-panel`
- **Framework:** Next.js
- **Build Command:** `npm run build`
- **Install Command:** `npm ci --legacy-peer-deps`
- **Output Directory:** (leave empty - defaults to `.next/`)
- **Node.js Version:** 18.x (set via dashboard or environment variable)

**Important:** 
- NO `vercel.json` file (uses default Next.js adapter)
- Build generates `.next/routes-manifest.json`
- Not a static export - uses SSR

### 2. Backend (`backend/`)

**Type:** Express.js API

**Vercel Dashboard Settings:**
- **Root Directory:** `backend`
- **Framework:** Other
- **Build Command:** `npm ci --production`
- **Install Command:** `npm install --legacy-peer-deps`

**Configuration File:** `backend/vercel.json`
- Routes all requests to `/api/index.js`
- Function memory: 1024 MB
- Max duration: 30 seconds

### 3. Frontend (`frontend/`)

**Type:** Next.js SPA

**Vercel Dashboard Settings:**
- **Root Directory:** `frontend`
- **Framework:** Next.js
- **Build Command:** `npm run build`
- **Install Command:** `npm install --legacy-peer-deps`

**Configuration File:** `frontend/vercel.json`
- Includes environment variables for API endpoints
- Output directory: `.next`

## Important Notes

- Each project has its own `package.json`, `next.config.js` (where applicable), and `.npmrc`
- No `nodeVersion` property in any `vercel.json` files (Vercel doesn't allow this in the schema)
- Admin panel uses `"engines": { "node": "18.x" }` in package.json instead
- All three projects are configured for production deployments independently
- The root `.vercelignore` prevents unnecessary files from being deployed

## Deployment Checklist

Before deploying to Vercel:

1. **Admin Panel:**
   ```bash
   cd admin-panel
   npm install --legacy-peer-deps
   npm run build
   # Verify .next/routes-manifest.json exists
   ```

2. **Backend:**
   ```bash
   cd backend
   npm install --legacy-peer-deps
   npm run build # if applicable
   ```

3. **Frontend:**
   ```bash
   cd frontend
   npm install --legacy-peer-deps
   npm run build
   ```

## Troubleshooting

### Error: "Invalid request: should NOT have additional property `nodeVersion`"
- Remove `nodeVersion` from any `vercel.json` file
- Use `"engines": { "node": "18.x" }` in `package.json` instead
- Set Node version in Vercel dashboard

### Error: ".next/routes-manifest.json not found"
- Ensure admin-panel does NOT have `output: 'export'` in next.config.js
- Ensure build script is `next build` (not `next export`)
- Run `npm run build` locally and verify `.next/` directory exists

### Admin panel returning 404
- Verify `vercel.json` does NOT exist in admin-panel directory
- Let Vercel use the default Next.js adapter
