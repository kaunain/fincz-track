#!/bin/bash

# Frontend Setup Script for Fincz Track

set -e

echo "🚀 Fincz Track Frontend Setup"
echo "=============================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo "✅ npm found: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Frontend setup complete!"
echo ""
echo "Available commands:"
echo "  npm run dev     - Start development server (http://localhost:5173)"
echo "  npm run build   - Build for production"
echo "  npm run preview - Preview production build"
echo ""
echo "📝 Configuration:"
echo "  - Copy .env.example to .env.local"
echo "  - Update VITE_API_BASE_URL if needed"
echo ""
echo "🚀 Start development with: npm run dev"
echo ""
