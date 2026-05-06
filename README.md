# Backnine Trades — Brand Package Site

Static HTML brand package for Backnine Trades — a third-party R&M operating company.

## Contents

| File | Purpose |
|------|---------|
| `index.html` | Cover page / package index |
| `flyer.html` | One-page sales flyer for prospective 3rd-party PMs |
| `naming.html` | Naming decision record — shortlist, domains, risk assessment |
| `logos.html` | Logo lockup options (selected mark + alternates) |

## Local preview

Open `index.html` in any browser. No build step required — pure static HTML/CSS/SVG.

```bash
open index.html
```

## Deploy to Vercel

This is a zero-config static site. No `package.json`, no framework — Vercel will serve it directly.

### One-time setup

1. **Push to GitHub** (or GitLab/Bitbucket):
   ```bash
   git init
   git add .
   git commit -m "Initial Backnine brand package"
   gh repo create backnine-site --public --source=. --push
   ```

2. **Connect to Vercel**:
   - Go to https://vercel.com/new
   - Import the `backnine-site` repo
   - Framework preset: **Other** (static)
   - Output directory: leave blank (root)
   - Click **Deploy**

3. **Custom domain** (optional):
   - In Vercel project settings → Domains, add `backninetrades.com`
   - Update DNS at your registrar to point to Vercel

### Subsequent updates

```bash
git add .
git commit -m "Update flyer copy"
git push
```

Vercel auto-deploys on every push to `main`.

## Print to PDF

Each HTML file is letter-size and prints clean. From any open file: `Cmd+P` → **Save as PDF**.
