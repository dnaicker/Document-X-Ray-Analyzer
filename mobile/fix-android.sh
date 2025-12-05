#!/bin/bash

echo "==================================="
echo "Fixing Android Project"
echo "==================================="
echo ""

echo "Step 1: Removing incomplete android folder..."
if [ -d "android" ]; then
    rm -rf android
    echo "✓ Android folder removed."
else
    echo "✓ No android folder found (already clean)."
fi
echo ""

echo "Step 2: Re-creating Android project..."
npx cap add android
echo ""

echo "Step 3: Syncing web assets..."
npx cap sync
echo ""

echo "==================================="
echo "✅ Done! Now open in Android Studio:"
echo "   npx cap open android"
echo "==================================="

