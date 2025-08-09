// Content script for YouTube time tracking

// Prevent multiple initializations
if (window.tubeTimeInitialized) {
  console.log('TubeTime already initialized, skipping...');
} else {
  window.tubeTimeInitialized = true;
  
  // Global variables
  let currentVideoInfo = null;
  let isPageActive = true;
  let lastActivityTime = Date.now();

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
        chrome.runtime.sendMessage({
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
    chrome.runtime.sendMessage({
      action: 'pageActive',
      data: { 
        videoInfo: currentVideoInfo,
        isActive: true 
      }
    });
  }

  // Notify background script that page is inactive
  function notifyPageInactive() {
    chrome.runtime.sendMessage({
      action: 'pageInactive',
      data: { isActive: false }
    });
  }

  // Check if auto-tracking should be enabled
  async function checkAutoTracking() {
    try {
      const data = await chrome.storage.local.get(['settings']);
      const settings = data.settings || {};
      
      if (settings.autoTrack) {
        // Auto-start tracking when YouTube is opened
        chrome.runtime.sendMessage({ action: 'startTracking' });
      }
    } catch (error) {
      console.error('Error checking auto-tracking settings:', error);
    }
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
    }
  });

  // Handle YouTube navigation (SPA)
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

  // Initialize content script
  (function() {
    // TubeTime content script loaded
    
    // Set up observers and event listeners
    setupVideoDetection();
    setupActivityTracking();
    setupPageVisibilityTracking();
    
    // Check if we should start tracking automatically
    checkAutoTracking();
  })();
} 