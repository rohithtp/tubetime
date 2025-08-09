// Content script for YouTube time tracking

// Prevent multiple initializations
if (window.tubeTimeInitialized) {
  // Already initialized, skipping...
} else {
  try {
    window.tubeTimeInitialized = true;
  
  // Global variables
  let currentVideoInfo = null;
  let isPageActive = true;
  let lastActivityTime = Date.now();
  let extensionContextValid = true;

  // Check if extension context is still valid
  function isExtensionContextValid() {
    try {
      // Try to access chrome.runtime to check if context is valid
      const isValid = typeof chrome !== 'undefined' && 
                     chrome.runtime && 
                     chrome.runtime.id;
      
      if (!isValid) {
        console.log('🔍 Extension context check failed: chrome.runtime not available');
      }
      
      return isValid;
    } catch (error) {
      console.log('🔍 Extension context check failed with error:', error.message);
      return false;
    }
  }

  // Attempt to recover from invalid context
  function attemptContextRecovery() {
    console.log('🔄 Attempting extension context recovery...');
    
    if (isExtensionContextValid()) {
      extensionContextValid = true;
      console.log('✅ Extension context recovered successfully');
      
      // Re-setup message listener
      try {
        setupMessageListener();
        console.log('✅ Message listener re-established');
      } catch (error) {
        console.error('❌ Failed to re-setup message listener:', error);
      }
      
      // Re-check auto-tracking
      try {
        checkAutoTracking();
        console.log('✅ Auto-tracking re-checked');
      } catch (error) {
        console.error('❌ Failed to re-check auto-tracking:', error);
      }
      
      // Re-extract video info if on YouTube
      if (window.location.pathname === '/watch') {
        try {
          extractVideoInfo();
          console.log('✅ Video info re-extracted');
        } catch (error) {
          console.error('❌ Failed to re-extract video info:', error);
        }
      }
    } else {
      console.log('❌ Extension context still invalid, will retry later');
      // Schedule another recovery attempt
      setTimeout(attemptContextRecovery, 10000);
    }
  }

  // Safe wrapper for chrome.runtime.sendMessage
  function safeSendMessage(message) {
    // Always check context validity before sending
    if (!isExtensionContextValid()) {
      extensionContextValid = false;
      console.warn('Extension context invalid, skipping message:', message.action);
      // Don't schedule recovery for pageActive messages to avoid spam
      if (message.action !== 'pageActive') {
        setTimeout(attemptContextRecovery, 5000);
      }
      return;
    }

    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Message send error:', chrome.runtime.lastError.message);
          if (chrome.runtime.lastError.message.includes('Extension context invalidated')) {
            extensionContextValid = false;
            console.log('Extension context invalidated, will attempt recovery');
            // Schedule recovery attempt
            setTimeout(attemptContextRecovery, 5000);
          }
        } else if (response) {
          console.log('Message sent successfully:', message.action);
        }
      });
    } catch (error) {
      console.warn('Failed to send message:', error);
      if (error.message.includes('Extension context invalidated')) {
        extensionContextValid = false;
        console.log('Extension context invalidated, will attempt recovery');
        // Schedule recovery attempt
        setTimeout(attemptContextRecovery, 5000);
      }
    }
  }

  // Set up video detection using MutationObserver
  function setupVideoDetection() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Check for video page changes
          if (window.location.pathname === '/watch') {
            extractVideoInfo();
          }
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Initial check
    if (window.location.pathname === '/watch') {
      setTimeout(extractVideoInfo, 1000); // Wait for page to load
    }
  }

  // Extract video information from YouTube page
  function extractVideoInfo() {
    try {
      // Get video title
      const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer') ||
                          document.querySelector('h1.title') ||
                          document.querySelector('h1');
      
      const title = titleElement ? titleElement.textContent.trim() : 'Unknown Title';
      
      // Get channel name
      const channelElement = document.querySelector('a.ytd-channel-name') ||
                            document.querySelector('.ytd-channel-name a') ||
                            document.querySelector('.channel-name a');
      
      const channel = channelElement ? channelElement.textContent.trim() : 'Unknown Channel';
      
      // Get video ID from URL
      const videoId = new URLSearchParams(window.location.search).get('v') || 'unknown';
      
      // Get video duration (if available)
      let duration = 0;
      const durationElement = document.querySelector('.ytp-time-duration');
      if (durationElement) {
        const durationText = durationElement.textContent;
        duration = parseDuration(durationText);
      }
      
      const videoInfo = {
        id: videoId,
        title: title,
        channel: channel,
        duration: duration,
        url: window.location.href,
        timestamp: Date.now()
      };
      
      // Only update if video info has changed
      if (!currentVideoInfo || currentVideoInfo.id !== videoInfo.id) {
        currentVideoInfo = videoInfo;
        // New video detected
        
        // Notify background script
        safeSendMessage({
          action: 'pageActive',
          data: { videoInfo: videoInfo }
        });
      }
    } catch (error) {
      console.error('Error extracting video info:', error);
    }
  }

  // Parse duration string (e.g., "10:30") to seconds
  function parseDuration(durationStr) {
    if (!durationStr) return 0;
    
    const parts = durationStr.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  }

  // Set up activity tracking (simplified)
  function setupActivityTracking() {
    // Only track basic page activity for video detection
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        lastActivityTime = Date.now();
        if (!isPageActive) {
          isPageActive = true;
          notifyPageActive();
        }
      }, { passive: true });
    });
    
      // Check for context recovery every 10 seconds
  setInterval(() => {
    if (!extensionContextValid && isExtensionContextValid()) {
      console.log('🔄 Periodic context check: attempting recovery');
      attemptContextRecovery();
    }
  }, 10000);
  }

  // Set up page visibility tracking (simplified)
  function setupPageVisibilityTracking() {
    document.addEventListener('visibilitychange', () => {
      // Only update activity time when tab becomes visible
      if (!document.hidden) {
        isPageActive = true;
        lastActivityTime = Date.now();
        notifyPageActive();
      }
    });
  }

  // Notify background script that page is active
  function notifyPageActive() {
    safeSendMessage({
      action: 'pageActive',
      data: { 
        videoInfo: currentVideoInfo,
        isActive: true 
      }
    });
  }

  // Notify background script that page is inactive
  function notifyPageInactive() {
    safeSendMessage({
      action: 'pageInactive',
      data: { isActive: false }
    });
  }

  // Check if auto-tracking should be enabled
  async function checkAutoTracking() {
    if (!extensionContextValid || !isExtensionContextValid()) {
      return;
    }

    try {
      const data = await chrome.storage.local.get(['settings']);
      const settings = data.settings || {};
      
      if (settings.autoTrack) {
        // Auto-start tracking when YouTube is opened
        safeSendMessage({ action: 'startTracking' });
      }
    } catch (error) {
      console.error('Error checking auto-tracking settings:', error);
      if (error.message.includes('Extension context invalidated')) {
        extensionContextValid = false;
      }
    }
  }

  // Listen for messages from popup
  function setupMessageListener() {
    console.log('🔧 Setting up message listener...');
    
    if (!isExtensionContextValid()) {
      console.log('❌ Cannot setup message listener: extension context invalid');
      return;
    }

    try {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('📨 Content script received message:', request.action);
        
        try {
          switch (request.action) {
            case 'getCurrentVideo':
              console.log('📹 Returning current video info');
              sendResponse({ videoInfo: currentVideoInfo });
              break;
            case 'getPageStatus':
              console.log('📊 Returning page status');
              sendResponse({ 
                isActive: isPageActive, 
                lastActivity: lastActivityTime,
                currentVideo: currentVideoInfo 
              });
              break;
            case 'refreshVideoInfo':
              console.log('🔄 Refreshing video info');
              // Force re-extraction of video info
              extractVideoInfo();
              sendResponse({ success: true });
              break;
            case 'checkAutoTracking':
              console.log('⚙️ Checking auto-tracking settings');
              // Re-check auto-tracking setting
              checkAutoTracking();
              sendResponse({ success: true });
              break;
            default:
              console.log('❓ Unknown message action:', request.action);
              sendResponse({ success: false, error: 'Unknown action' });
              break;
          }
        } catch (error) {
          console.error('❌ Error handling message:', error);
          sendResponse({ success: false, error: error.message });
        }
      });
      
      console.log('✅ Message listener setup successfully');
    } catch (error) {
      console.error('❌ Error setting up message listener:', error);
      if (error.message.includes('Extension context invalidated')) {
        extensionContextValid = false;
        console.log('🔄 Extension context invalidated, scheduling recovery');
        setTimeout(attemptContextRecovery, 5000);
      }
    }
  }

  // Handle YouTube navigation (SPA)
  function setupNavigationTracking() {
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        // YouTube navigation detected
        
        // Extract video info after navigation
        setTimeout(extractVideoInfo, 1000);
      }
    }).observe(document, { subtree: true, childList: true });
  }

  // Initialize content script
  (function() {
    console.log('🚀 Initializing TubeTime content script...');
    
    // Wait a bit for the page to fully load
    setTimeout(() => {
      // Check extension context first
      if (!isExtensionContextValid()) {
        console.log('⚠️ Extension context invalid during initialization, will retry');
        extensionContextValid = false;
        setTimeout(attemptContextRecovery, 2000);
        return;
      }
    
      try {
        // Set up observers and event listeners
        setupVideoDetection();
        console.log('✅ Video detection setup');
        
        setupActivityTracking();
        console.log('✅ Activity tracking setup');
        
        setupPageVisibilityTracking();
        console.log('✅ Page visibility tracking setup');
        
        setupMessageListener();
        console.log('✅ Message listener setup');
        
        setupNavigationTracking();
        console.log('✅ Navigation tracking setup');
        
        // Check if we should start tracking automatically
        checkAutoTracking();
        console.log('✅ Auto-tracking check complete');
        
        console.log('🎉 TubeTime content script initialized successfully');
      } catch (error) {
        console.error('❌ Error during content script initialization:', error);
        if (error.message.includes('Extension context invalidated')) {
          extensionContextValid = false;
          setTimeout(attemptContextRecovery, 5000);
        }
      }
    }, 1000); // Wait 1 second for page to load
  })();
  } catch (error) {
    console.error('Error initializing TubeTime content script:', error);
  }
} 