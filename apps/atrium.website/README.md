This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy (Hostinger)

www.atriumad.com runs on Hostinger as a static site (moved from Vercel on 2026-11-07).
It is served from `public_html` of the `atriumad.com` website (account `u105453487`);
`public_html/cdn` is cdn.atriumad.com and must not be deleted.

1. Build: `sh scripts/build-hostinger.sh` (static export to `out/`).
2. Upload: get upload credentials from Hostinger's "Generate upload URL" API for
   `atriumad.com`, set `HOSTINGER_UPLOAD_URL`, `HOSTINGER_AUTH_KEY` and
   `HOSTINGER_REST_AUTH_KEY`, then run `python3 scripts/upload-hostinger.py`.
   Files are uploaded one by one; nothing on the server is deleted.

URLs have no trailing slash (`/about`); `public/.htaccess` serves `about.html` for them and
handles HTTPS, `atriumad.com` → `www`, and `/process` → `/services`.
