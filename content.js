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
      return typeof chrome !== 'undefined' && 
             chrome.runtime && 
             chrome.runtime.id;
    } catch (error) {
      return false;
    }
  }

  // Attempt to recover from invalid context
  function attemptContextRecovery() {
    if (!extensionContextValid && isExtensionContextValid()) {
      extensionContextValid = true;
      console.log('Extension context recovered');
      // Re-setup message listener
      setupMessageListener();
      // Re-check auto-tracking
      checkAutoTracking();
    }
  }

  // Safe wrapper for chrome.runtime.sendMessage
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

  // Set up activity tracking
  function setupActivityTracking() {
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
    
    // Check for inactivity every 30 seconds
    setInterval(checkInactivity, 30000);
    
    // Check for context recovery every 10 seconds
    setInterval(attemptContextRecovery, 10000);
  }

  // Check for user inactivity
  function checkInactivity() {
    const now = Date.now();
    const inactiveThreshold = 5 * 60 * 1000; // 5 minutes
    
    if (isPageActive && (now - lastActivityTime) > inactiveThreshold) {
      isPageActive = false;
      notifyPageInactive();
    }
  }

  // Set up page visibility tracking
  function setupPageVisibilityTracking() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        isPageActive = false;
        notifyPageInactive();
      } else {
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
    if (!extensionContextValid || !isExtensionContextValid()) {
      return;
    }

    try {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        try {
          switch (request.action) {
            case 'getCurrentVideo':
              sendResponse({ videoInfo: currentVideoInfo });
              break;
            case 'getPageStatus':
              sendResponse({ 
                isActive: isPageActive, 
                lastActivity: lastActivityTime,
                currentVideo: currentVideoInfo 
              });
              break;
            case 'refreshVideoInfo':
              // Force re-extraction of video info
              extractVideoInfo();
              sendResponse({ success: true });
              break;
            case 'checkAutoTracking':
              // Re-check auto-tracking setting
              checkAutoTracking();
              sendResponse({ success: true });
              break;
          }
        } catch (error) {
          console.error('Error handling message:', error);
          sendResponse({ success: false, error: error.message });
        }
      });
    } catch (error) {
      console.error('Error setting up message listener:', error);
      if (error.message.includes('Extension context invalidated')) {
        extensionContextValid = false;
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
    // TubeTime content script loaded
    
    // Set up observers and event listeners
    setupVideoDetection();
    setupActivityTracking();
    setupPageVisibilityTracking();
    setupMessageListener();
    setupNavigationTracking();
    
    // Check if we should start tracking automatically
    checkAutoTracking();
  })();
  } catch (error) {
    console.error('Error initializing TubeTime content script:', error);
  }
} 