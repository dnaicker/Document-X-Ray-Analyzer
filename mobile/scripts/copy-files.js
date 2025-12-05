#!/usr/bin/env node

/**
 * Cross-platform file copying script
 * Works on Windows, macOS, and Linux
 */

const fs = require('fs');
const path = require('path');

// Get the operation type from command line argument
const operation = process.argv[2] || 'src';

// Paths
const projectRoot = path.join(__dirname, '..', '..');
const mobileRoot = path.join(__dirname, '..');
const wwwDir = path.join(mobileRoot, 'www');

/**
 * Recursively copy directory
 */
function copyDir(src, dest) {
  // Create destination directory
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and other unnecessary directories
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
        continue;
      }
      copyDir(srcPath, destPath);
    } else {
      // Copy file
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Copy file
 */
function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

// Ensure www directory exists
if (!fs.existsSync(wwwDir)) {
  fs.mkdirSync(wwwDir, { recursive: true });
}

console.log(`📦 Copying files for operation: ${operation}`);

try {
  switch (operation) {
    case 'src':
      console.log('📂 Copying src files...');
      // Copy all files from ../src/ to www/
      copyDir(path.join(projectRoot, 'src'), wwwDir);
      
      // Copy lib directory
      console.log('📚 Copying lib files...');
      copyDir(path.join(projectRoot, 'lib'), path.join(wwwDir, 'lib'));
      
      console.log('✅ Source files copied successfully!');
      break;

    case 'assets':
      console.log('🎨 Copying assets...');
      // Copy assets directory
      copyDir(path.join(projectRoot, 'assets'), path.join(wwwDir, 'assets'));
      console.log('✅ Assets copied successfully!');
      break;

    case 'mobile':
      console.log('📱 Copying mobile-specific files...');
      // Copy mobile-specific files from mobile/src/ to www/
      const mobileSrcDir = path.join(mobileRoot, 'src');
      
      if (fs.existsSync(mobileSrcDir)) {
        const mobileFiles = fs.readdirSync(mobileSrcDir);
        
        for (const file of mobileFiles) {
          const srcFile = path.join(mobileSrcDir, file);
          const destFile = path.join(wwwDir, file);
          
          if (fs.statSync(srcFile).isFile()) {
            copyFile(srcFile, destFile);
            console.log(`  ✓ ${file}`);
          }
        }
      }
      
      // Replace index.html with mobile version
      const mobileIndexSrc = path.join(mobileRoot, 'src', 'mobile-index.html');
      const indexDest = path.join(wwwDir, 'index.html');
      
      if (fs.existsSync(mobileIndexSrc)) {
        copyFile(mobileIndexSrc, indexDest);
        console.log('  ✓ index.html (from mobile-index.html)');
      }
      
      console.log('✅ Mobile files copied successfully!');
      console.log('\n📱 Mobile-specific files included:');
      console.log('  • capacitor-bridge.js (API bridge)');
      console.log('  • mobile-styles.css (responsive overrides)');
      console.log('  • mobile-navigation.js (bottom nav + swipe disabled)');
      console.log('  • mobile-file-handler.js (file opening + zoom)');
      console.log('  • mobile-view-tabs.js (analysis sub-tabs)');
      console.log('  • mobile-document-scroll.js (continuous scroll)');
      console.log('  • mobile-fixes.js (all UX fixes + highlighting)');
      break;

    default:
      console.log('❌ Unknown operation:', operation);
      console.log('Valid operations: src, assets, mobile');
      process.exit(1);
  }

  console.log('\n✨ All done! Directory structure:');
  console.log('www/');
  console.log('├── index.html (mobile version)');
  console.log('├── styles.css');
  console.log('├── mobile-styles.css');
  console.log('├── renderer.js');
  console.log('├── components/');
  console.log('├── lib/');
  console.log('└── assets/');

} catch (error) {
  console.error('❌ Error copying files:', error.message);
  process.exit(1);
}

