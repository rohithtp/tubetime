// Script to generate PNG icons from SVG
// This is a placeholder script - you'll need to manually create PNG icons
// or use a tool like Inkscape, ImageMagick, or online converters

const fs = require('fs');
const path = require('path');

console.log('Icon generation script');
console.log('======================');
console.log('');
console.log('To generate PNG icons from the SVG file:');
console.log('');
console.log('1. Use an online converter:');
console.log('   - Go to https://convertio.co/svg-png/');
console.log('   - Upload icons/icon.svg');
console.log('   - Convert to PNG with sizes: 16x16, 48x48, 128x128');
console.log('');
console.log('2. Use ImageMagick (if installed):');
console.log('   convert icons/icon.svg -resize 16x16 icons/icon16.png');
console.log('   convert icons/icon.svg -resize 48x48 icons/icon48.png');
console.log('   convert icons/icon.svg -resize 128x128 icons/icon128.png');
console.log('');
console.log('3. Use Inkscape (if installed):');
console.log('   inkscape icons/icon.svg --export-png=icons/icon16.png --export-width=16 --export-height=16');
console.log('   inkscape icons/icon.svg --export-png=icons/icon48.png --export-width=48 --export-height=48');
console.log('   inkscape icons/icon.svg --export-png=icons/icon128.png --export-width=128 --export-height=128');
console.log('');
console.log('4. Manual creation:');
console.log('   - Open icons/icon.svg in any image editor');
console.log('   - Export as PNG with the required sizes');
console.log('');

// Check if SVG exists
const svgPath = path.join(__dirname, 'icons', 'icon.svg');
if (fs.existsSync(svgPath)) {
  console.log('✓ SVG icon found at:', svgPath);
} else {
  console.log('✗ SVG icon not found at:', svgPath);
}

// Check for existing PNG icons
const iconSizes = [16, 48, 128];
iconSizes.forEach(size => {
  const pngPath = path.join(__dirname, 'icons', `icon${size}.png`);
  if (fs.existsSync(pngPath)) {
    console.log(`✓ PNG icon ${size}x${size} found`);
  } else {
    console.log(`✗ PNG icon ${size}x${size} missing`);
  }
});

console.log('');
console.log('After generating icons, you can load the extension in Chrome:');
console.log('1. Go to chrome://extensions/');
console.log('2. Enable Developer mode');
console.log('3. Click "Load unpacked" and select this folder');
console.log(''); 