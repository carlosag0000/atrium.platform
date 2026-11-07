#!/bin/sh
# Build www.atriumad.com as a static site for Hostinger. Output: apps/atrium.website/out/
# Both values are public (they appear in the live page HTML), so they live here, not in a secret store.
set -e
cd "$(dirname "$0")/.."
export PATH="$HOME/.local/bin:$PATH"
export NEXT_TELEMETRY_DISABLED=1
export NEXT_PUBLIC_SITE_URL=https://www.atriumad.com
export NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=zqisihyg
rm -rf .next out
bun run build
echo "Built $(find out -type f | wc -l | tr -d ' ') files in $(pwd)/out"
