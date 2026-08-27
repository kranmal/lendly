#!/usr/bin/env bash
# Builds the same static web export deploy-pages.yml ships, then serves it
# so Playwright can drive it like the deployed site. No GH_PAGES_BASE_URL
# here on purpose - the local build should root at "/" to match the test
# server's baseURL, the same way it would if lendly were deployed at
# https://kranmal.github.io/ itself instead of a /lendly subpath.
set -e
cd "$(dirname "$0")/.."
npx expo export -p web
python3 -m http.server 8030 --directory dist
