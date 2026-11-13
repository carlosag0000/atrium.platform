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

## Deploy (Atrium VPS)

www.atriumad.com runs on the Atrium VPS (2.24.194.204) since Nov 13, 2026:

- `/opt/atriumsite/public` — the static export plus `public/api/*.php`, served by Apache + PHP 8.3
  (`deploy/vps/`, Docker Compose project **atriumsite**, with its own MariaDB). Never run it under another
  project name: the Atrium app's project is called `deploy`.
- `/opt/atriumsite/cdn` — cdn.atriumad.com media.
- HTTPS and the domains are handled by the Caddy proxy of the Atrium app (`/opt/atrium/deploy/Caddyfile`,
  also kept in `~/Atrium App/deploy/Caddyfile`). Edit both copies together.
- Secrets: `/opt/atriumsite/deploy/.env` and `/opt/atriumsite/public/api/config.php`, on the server only.
- Backups: nightly at 08:45 UTC, 14 days, in `/opt/atriumsite/backups`.

Publish a change:

```bash
sh scripts/deploy-vps.sh
```

It builds, sends the site with rsync (files the site writes itself — uploads, CVs, cache, config — are never
touched) and restarts the web container. SSH key: `~/.ssh/atrium_vps_ops`.

The old Hostinger copy (scripts/upload-hostinger.py) is kept as a fallback only; uploading there does not change
the live site.
