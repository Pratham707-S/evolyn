#!/usr/bin/env bash
set -e

echo "🔍 Running Evolyn Pre-PR Verification..."

echo "1. Running unit & integration tests..."
npm test

echo "2. Running TypeScript typechecks across workspaces..."
npm run typecheck

echo "3. Running linter..."
npm run lint

echo "4. Running production builds..."
npm run build

echo "✅ All verification checks passed successfully!"
