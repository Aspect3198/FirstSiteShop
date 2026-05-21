# Deployment Guide

This guide explains how to deploy the Wondermarket Vite + Supabase application to static hosting providers.

## Prerequisites

- Node.js 18+
- Project dependencies installed with `npm install`
- A Supabase project with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

## Local build and preview

```bash
npm install
npm run build
npm run preview
```

If `npm run preview` runs successfully, the production build is ready for deployment.

## Environment variables

Set these variables in your hosting dashboard:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Do not commit these values to source control.

## Netlify

1. Connect your repository to Netlify.
2. Set the build command to:

```bash
npm run build
```

3. Set the publish directory to:

```bash
dist
```

4. Add environment variables in Netlify Site settings:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

5. Deploy the site.

## Vercel

1. Import the repository into Vercel.
2. Use these settings:

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

3. Add environment variables in Vercel Dashboard:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

4. Deploy.

## Cloudflare Pages

1. Create a new Pages project.
2. Configure the build settings:

- Framework: `None`
- Build command: `npm run build`
- Build output directory: `dist`

3. Add environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

4. Deploy.

## GitHub Pages

GitHub Pages can serve the static `dist` folder with a GitHub Action or via the repository `gh-pages` branch.

Recommended approach:

1. Build locally:

```bash
npm run build
```

2. Deploy `dist/` using a static deploy tool or action.

3. Ensure your repository does not publish `.env.local`.

## Notes

- The app is static and uses frontend environment variables for Supabase.
- No server-side runtime is required.
- If your hosting provider supports environment variables, use them in the dashboard.
