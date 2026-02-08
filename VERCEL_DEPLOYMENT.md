# Vercel Deployment Configuration

## Current Status
- Build Command: `pnpm run build:vercel` (defined in vercel.json)
- Build Script: `next build` (no Turbopack, standard webpack)
- Latest Commit: Should deploy from main branch HEAD

## Fixed Issues
1. Removed broken API routes:
   - `/api/forge/projects` (used deleted Drizzle ORM)
   - `/api/bids/route.ts` (used deleted @/lib/api-auth)
   - `/api/contracts/generate` (used deleted @/lib/contractGenerator)

2. Fixed TypeScript errors with User union types (ClientUser vs VendorUser)

3. Configured proper build command without Turbopack (causes module resolution issues)

## Verification
To verify the build works locally:
\`\`\`bash
pnpm run build
\`\`\`

Should complete without errors using standard Next.js webpack build.
