#!/bin/sh
set -e

echo "[start] Running database migrations with drizzle-kit..."
npx drizzle-kit push

echo "[start] Starting server..."
node dist/index.js
