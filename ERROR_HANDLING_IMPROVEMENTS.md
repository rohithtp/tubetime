# Extension Context Invalidation Error Handling

## Problem Description

The "Extension context invalidated" error occurs when Chrome's extension system invalidates the extension context, typically due to:

1. **Extension Reload/Update**: When the extension is reloaded or updated while content scripts are running
2. **Service Worker Termination**: When the background service worker is terminated and restarted
3. **Browser Restart**: When the browser is restarted
4. **Extension Disable/Enable**: When the extension is temporarily disabled and re-enabled

## Root Cause

The original code made direct calls to `chrome.runtime.sendMessage()` without proper error handling, causing the extension to crash when the context became invalid.

## Solution Implemented

### 1. Context Validation

Added a `isExtensionContextValid()` function that checks if the extension context is still valid:

```javascript
function isExtensionContextValid() {
  try {
    return typeof chrome !== 'undefined' && 
           chrome.runtime && 
           chrome.runtime.id;
  } catch (error) {
    return false;
  }
}
```

### 2. Safe Message Sending

Created a `safeSendMessage()` wrapper that handles context invalidation gracefully:

```javascript
function safeSendMessage(message) {
  if (!extensionContextValid || !isExtensionContextValid()) {
    extensionContextValid = false;
    console.warn('Extension context invalid, skipping message:', message.action);
    return;
  }

  try {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('Message send error:', chrome.runtime.lastError.message);
        if (chrome.runtime.lastError.message.includes('Extension context invalidated')) {
          extensionContextValid = false;
        }
      }
    });
  } catch (error) {
    console.warn('Failed to send message:', error);
    if (error.message.includes('Extension context invalidated')) {
      extensionContextValid = false;
    }
  }
}
```

### 3. Context Recovery

Implemented automatic recovery when the context becomes valid again:

```javascript
function attemptContextRecovery() {
  if (!extensionContextValid && isExtensionContextValid()) {
    extensionContextValid = true;
    console.log('Extension context recovered');
    setupMessageListener();
    checkAutoTracking();
  }
}
```

### 4. Enhanced Error Handling

Added comprehensive try-catch blocks around all Chrome API calls in both content and background scripts.

### 5. Startup Handling

Added `chrome.runtime.onStartup` listener to handle extension restarts:

```javascript
chrome.runtime.onStartup.addListener(() => {
  extensionContextValid = true;
  initializeStorage().catch(error => {
    console.error('Failed to initialize storage on startup:', error);
  });
});
```

## Files Modified

### content.js
- Added context validation functions
- Wrapped all `chrome.runtime.sendMessage()` calls with `safeSendMessage()`
- Added automatic recovery mechanism
- Enhanced error handling for all Chrome API calls

### background.js
- Added context validation checks
- Enhanced error handling for all storage and messaging operations
- Added startup event handling
- Improved error recovery mechanisms

### test-extension.js
- Created comprehensive test suite for extension functionality
- Added context validation tests
- Created manual testing procedures

## Testing the Fixes

### 1. Automatic Testing

Run the test script in the browser console on a YouTube page:

```javascript
// Load the test script
// Then run:
window.tubeTimeTests.runAllTests()
```

### 2. Manual Testing

#### Test Context Invalidation Handling:

1. **Load the extension** in Chrome
2. **Navigate to YouTube** and open a video
3. **Open browser console** (F12)
4. **Reload the extension** in `chrome://extensions/`
5. **Check console** for recovery messages
6. **Verify functionality** continues working

#### Test Message Sending:

1. **Open YouTube** with the extension loaded
2. **Open console** and run:
   ```javascript
   chrome.runtime.sendMessage({ action: 'getStats' }, console.log)
   ```
3. **Reload extension** and try again
4. **Verify** error handling works properly

#### Test Storage Access:

1. **Open console** and run:
   ```javascript
   chrome.storage.local.get(['totalTime']).then(console.log)
   ```
2. **Reload extension** and try again
3. **Verify** proper error handling

## Expected Behavior

### Before Fix:
- Extension crashes with "Extension context invalidated" error
- No recovery mechanism
- Manual intervention required

### After Fix:
- Graceful error handling with console warnings
- Automatic recovery when context becomes valid
- Continued functionality after extension reloads
- No crashes or unhandled errors

## Monitoring

The extension now logs important events:

- `Extension context invalid, skipping message: [action]` - When context is invalid
- `Extension context recovered` - When context becomes valid again
- `Message send error: [error]` - When message sending fails
- `Failed to send message: [error]` - When message sending throws an exception

## Best Practices

1. **Always check context validity** before making Chrome API calls
2. **Use try-catch blocks** around all Chrome API operations
3. **Implement recovery mechanisms** for temporary failures
4. **Log errors appropriately** for debugging
5. **Test extension reload scenarios** during development

## Future Improvements

1. **Retry mechanisms** for failed operations
2. **User notifications** for context invalidation
3. **Automatic extension reload** detection
4. **Enhanced logging** for production debugging
5. **Performance monitoring** for context validation checks 