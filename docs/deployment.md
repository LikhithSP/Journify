# Deployment & Hosting Guide

This guide details how to build, configure, and deploy **Journify** as a production static web application and Progressive Web App.

---

## 1. Production Build

Journify is compiled using Vite and TypeScript:

```bash
# Install dependencies
npm install

# Type-check and build production bundle
npm run build
```

The compiled static assets are generated in the `dist/` directory:
- `dist/index.html`: Entry point with PWA manifest and viewport configuration.
- `dist/assets/`: Minified and code-split JavaScript and CSS chunks.
- `dist/sw.js`: Service worker handling offline caching and background sync.

---

## 2. Environment Configuration

Ensure the production environment contains the required client environment variables:

| Variable | Description | Example |
| -------- | ----------- | ------- |
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public anonymous API key | `eyJhbGciOi...` |

> [!NOTE]
> Never commit actual `.env` files containing production keys to version control. Set these in your hosting provider's dashboard (e.g. Vercel / Netlify Environment Variables settings).

---

## 3. Recommended Hosting Platforms

### Vercel
1. Import the repository in Vercel.
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Add Single Page Application (SPA) rewrite rules (already configured in `vercel.json`):
   ```json
   {
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
6. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under **Project Settings → Environment Variables**.

### Netlify
1. Build Command: `npm run build`.
2. Publish Directory: `dist`.
3. SPA Redirect Rule (`dist/_redirects` or `netlify.toml`):
   ```
   /*    /index.html   200
   ```

---

## 4. Post-Deployment Verification

1. **PWA Installability**: Verify that the browser install prompt appears and the Web App Manifest loads without errors.
2. **Offline Resilience**: Open Chrome DevTools → Network → set to "Offline" and refresh the page. The cached shell should load seamlessly.
3. **Database Connectivity**: Sign in and create a journal entry to ensure Supabase Auth and database tables are reachable.
