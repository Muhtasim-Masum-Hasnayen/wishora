# Wishora — Birthday Website Builder

A responsive birthday microsite builder made with Next.js, React, TypeScript and CSS. It includes relationship-based themes, a live preview, editable birthday content, local draft saving, and shareable links.

## Run locally

1. Install [Node.js LTS](https://nodejs.org/) if it is not already installed.
2. Extract this ZIP and open the `wishora` folder in VS Code.
3. Open Terminal → New Terminal and run:

```bash
npm install
npm run dev
```

4. Open the local URL shown in the terminal (usually `http://localhost:3000`).

## Deploy to Vercel

### Option A — GitHub (recommended)
1. Create a new GitHub repository.
2. Upload/push all files inside this folder.
3. In Vercel, choose **Add New → Project** and import that repository.
4. Keep the default Next.js settings and click **Deploy**.

### Option B — Vercel CLI
```bash
npm install
npm run build
npx vercel
```

## Included features
- 10 relationship categories: male friend, female friend, boyfriend, girlfriend, male/female best friend, brother, sister, husband and wife.
- Theme presets with relationship-specific colors and visual treatments.
- Live preview while editing.
- Personal message, sender name, birthday person's name, memory note and photo upload.
- Surprise reveal screen, animated hearts/stars/confetti-style decorations.
- Copy/share link using a URL-encoded payload, including an uploaded and compressed photo.
- Save draft in browser localStorage.
- Download a simple text version of the wish.
- Responsive layout for mobile, tablet and desktop.

## Important MVP note
This starter is intentionally backend-free so it can be deployed to Vercel without setting up a database. Drafts are saved in the current browser only. Uploaded photos are compressed in the browser and included in the share URL; published wishes are encoded into that URL, so avoid putting sensitive/private information in a public link. For a production platform, add a database and object storage (e.g. Supabase) to support persistent short links, accounts, larger image uploads and moderation.

## Customize
- Main page and logic: `app/page.tsx`
- Global styles: `app/globals.css`
- App metadata: `app/layout.tsx`
