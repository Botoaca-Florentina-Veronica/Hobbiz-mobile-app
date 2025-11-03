#!/bin/bash
# build-backend.sh - Script pentru Render

echo "🚀 Starting backend build..."

# Verifică Node.js version
node --version
npm --version

# Instalare dependințe
echo "📦 Installing dependencies..."
npm ci --production

echo "✅ Backend build completed!"
