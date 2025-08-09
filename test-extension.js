// Test script for TubeTime extension context handling
// Run this in the browser console on a YouTube page to test the extension

console.log('TubeTime Extension Test Script');

// Test 1: Check if extension is loaded
function testExtensionLoaded() {
  console.log('Test 1: Checking if extension is loaded...');
  
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    console.log('✅ Extension context is valid');
    return true;
  } else {
    console.log('❌ Extension context is invalid');
    return false;
  }
}

// Test 2: Test message sending
function testMessageSending() {
  console.log('Test 2: Testing message sending...');
  
  try {
    chrome.runtime.sendMessage({ action: 'getStats' }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('❌ Message send failed:', chrome.runtime.lastError.message);
      } else {
        console.log('✅ Message sent successfully:', response);
      }
    });
  } catch (error) {
    console.log('❌ Message send error:', error.message);
  }
}

// Test 3: Test storage access
async function testStorageAccess() {
  console.log('Test 3: Testing storage access...');
  
  try {
    const data = await chrome.storage.local.get(['totalTime', 'sessions']);
    console.log('✅ Storage access successful:', data);
  } catch (error) {
    console.log('❌ Storage access failed:', error.message);
  }
}

// Test 4: Simulate context invalidation (manual test)
function testContextInvalidation() {
  console.log('Test 4: Context invalidation test...');
  console.log('To test context invalidation handling:');
  console.log('1. Reload the extension in chrome://extensions/');
  console.log('2. Check the console for recovery messages');
  console.log('3. Try sending messages again');
}

// Test 5: Check content script initialization
function testContentScriptInit() {
  console.log('Test 5: Checking content script initialization...');
  
  if (window.tubeTimeInitialized) {
    console.log('✅ Content script is initialized');
  } else {
    console.log('❌ Content script is not initialized');
  }
}

// Run all tests
async function runAllTests() {
  console.log('=== Running TubeTime Extension Tests ===');
  
  testExtensionLoaded();
  testMessageSending();
  await testStorageAccess();
  testContextInvalidation();
  testContentScriptInit();
  
  console.log('=== Tests Complete ===');
}

// Export functions for manual testing
window.tubeTimeTests = {
  testExtensionLoaded,
  testMessageSending,
  testStorageAccess,
  testContextInvalidation,
  testContentScriptInit,
  runAllTests
};

console.log('TubeTime test functions available at window.tubeTimeTests');
console.log('Run window.tubeTimeTests.runAllTests() to execute all tests'); 