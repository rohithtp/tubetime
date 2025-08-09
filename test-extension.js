// Test script to validate TubeTime extension structure
const fs = require('fs');
const path = require('path');

console.log('TubeTime Extension Validation');
console.log('=============================');
console.log('');

// Required files for Chrome extension
const requiredFiles = [
  'manifest.json',
  'background.js',
  'content.js',
  'popup.html',
  'popup.css',
  'popup.js'
];

// Required icon sizes
const requiredIcons = [
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png'
];

let allValid = true;

// Check required files
console.log('Checking required files:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✓ ${file}`);
  } else {
    console.log(`✗ ${file} - MISSING`);
    allValid = false;
  }
});

console.log('');

// Check manifest.json structure
console.log('Validating manifest.json:');
try {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  
  // Check required manifest fields
  const requiredFields = ['manifest_version', 'name', 'version', 'permissions'];
  requiredFields.forEach(field => {
    if (manifest[field]) {
      console.log(`✓ ${field}: ${manifest[field]}`);
    } else {
      console.log(`✗ ${field} - MISSING`);
      allValid = false;
    }
  });
  
  // Check manifest version
  if (manifest.manifest_version === 3) {
    console.log('✓ Using Manifest V3 (recommended)');
  } else {
    console.log('⚠ Using Manifest V2 (deprecated)');
  }
  
  // Check permissions
  const requiredPermissions = ['storage', 'activeTab'];
  requiredPermissions.forEach(permission => {
    if (manifest.permissions && manifest.permissions.includes(permission)) {
      console.log(`✓ Permission: ${permission}`);
    } else {
      console.log(`✗ Permission: ${permission} - MISSING`);
      allValid = false;
    }
  });
  
} catch (error) {
  console.log(`✗ manifest.json - INVALID JSON: ${error.message}`);
  allValid = false;
}

console.log('');

// Check icons
console.log('Checking icons:');
requiredIcons.forEach(icon => {
  if (fs.existsSync(icon)) {
    console.log(`✓ ${icon}`);
  } else {
    console.log(`✗ ${icon} - MISSING (run: node generate-icons.js for instructions)`);
    allValid = false;
  }
});

console.log('');

// Check file sizes
console.log('Checking file sizes:');
const filesToCheck = ['background.js', 'content.js', 'popup.js'];
filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`✓ ${file}: ${sizeKB} KB`);
    
    if (stats.size > 1024 * 1024) { // 1MB
      console.log(`⚠ ${file} is larger than 1MB - consider optimization`);
    }
  }
});

console.log('');

// Check for common issues
console.log('Checking for common issues:');
const content = fs.readFileSync('content.js', 'utf8');
const background = fs.readFileSync('background.js', 'utf8');

// Check for console.log statements (should be removed in production)
const consoleLogs = (content.match(/console\.log/g) || []).length + 
                   (background.match(/console\.log/g) || []).length;
if (consoleLogs > 0) {
  console.log(`⚠ Found ${consoleLogs} console.log statements (remove for production)`);
} else {
  console.log('✓ No console.log statements found');
}

// Check for error handling
if (content.includes('try') && content.includes('catch')) {
  console.log('✓ Error handling found in content script');
} else {
  console.log('⚠ Limited error handling in content script');
}

if (background.includes('try') && background.includes('catch')) {
  console.log('✓ Error handling found in background script');
} else {
  console.log('⚠ Limited error handling in background script');
}

console.log('');

// Final result
if (allValid) {
  console.log('🎉 Extension validation PASSED!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Generate PNG icons (see generate-icons.js)');
  console.log('2. Load extension in Chrome: chrome://extensions/');
  console.log('3. Enable Developer mode and click "Load unpacked"');
  console.log('4. Test on YouTube.com');
} else {
  console.log('❌ Extension validation FAILED!');
  console.log('Please fix the issues above before loading the extension.');
}

console.log(''); 