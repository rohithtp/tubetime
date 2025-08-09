// Background service worker for TubeTime extension

let isTracking = false;
let startTime = null;
let currentSession = null;

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  // Extension installed successfully
  console.log('TubeTime extension installed');
  initializeStorage().catch(error => {
    console.error('Failed to initialize storage:', error);
  });
});

// Check storage access
async function checkStorageAccess() {
  try {
    await chrome.storage.local.get(['test']);
    return true;
  } catch (error) {
    console.error('Storage access denied:', error);
    return false;
  }
}

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    switch (request.action) {
      case 'startTracking':
        startTracking().then(() => {
          sendResponse({ success: true });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
        return true; // Keep message channel open for async response
      case 'stopTracking':
        stopTracking().then(() => {
          sendResponse({ success: true });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
        return true; // Keep message channel open for async response
      case 'getStats':
        getStats().then(stats => sendResponse(stats)).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
        return true; // Keep message channel open for async response
      case 'exportData':
        exportData().then(data => sendResponse(data)).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
        return true;
      case 'clearData':
        clearData().then(() => sendResponse({ success: true })).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
        return true;
      case 'pageActive':
        handlePageActive(request.data);
        sendResponse({ success: true });
        break;
      case 'pageInactive':
        handlePageInactive();
        sendResponse({ success: true });
        break;
      default:
        sendResponse({ success: false, error: 'Unknown action' });
        break;
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
});

// Initialize storage with default values
async function initializeStorage() {
  try {
    // Check if storage is accessible
    await chrome.storage.local.get(['test']);
    
    const data = await chrome.storage.local.get(['isTracking', 'totalTime', 'sessions', 'settings']);
    
    if (!data.totalTime) {
      await chrome.storage.local.set({
        totalTime: 0,
        sessions: [],
        settings: {
          autoTrack: true,
          exportFormat: 'json',
          dailyLimit: 0 // 0 means no limit
        }
      });
    }
  } catch (error) {
    console.error('Storage initialization failed:', error);
    // Try to reinitialize after a delay
    setTimeout(initializeStorage, 1000);
  }
}

// Start tracking time
async function startTracking() {
  if (!isTracking) {
    isTracking = true;
    startTime = Date.now();
    currentSession = {
      id: Date.now(),
      startTime: startTime,
      endTime: null,
      duration: 0,
      videos: []
    };
    
    try {
      await chrome.storage.local.set({ isTracking: true });
      // Started tracking YouTube time
    } catch (error) {
      console.error('Failed to save tracking state:', error);
    }
  }
}

// Stop tracking time
async function stopTracking() {
  if (isTracking && currentSession) {
    isTracking = false;
    const endTime = Date.now();
    currentSession.endTime = endTime;
    currentSession.duration = endTime - startTime;
    
    // Save session
    await saveSession(currentSession);
    
    // Update total time
    await updateTotalTime(currentSession.duration);
    
    startTime = null;
    currentSession = null;
    
    try {
      await chrome.storage.local.set({ isTracking: false });
      // Stopped tracking YouTube time
    } catch (error) {
      console.error('Failed to save tracking state:', error);
    }
  }
}

// Handle page becoming active
function handlePageActive(data) {
  if (data && data.videoInfo) {
    if (currentSession) {
      currentSession.videos.push({
        id: data.videoInfo.id,
        title: data.videoInfo.title,
        channel: data.videoInfo.channel,
        timestamp: Date.now(),
        duration: data.videoInfo.duration || 0
      });
    }
  }
}

// Handle page becoming inactive
function handlePageInactive() {
  // Could implement pause/resume functionality here
  // Page became inactive
}

// Save session to storage
async function saveSession(session) {
  const data = await chrome.storage.local.get(['sessions']);
  const sessions = data.sessions || [];
  sessions.push(session);
  
  // Keep only last 100 sessions to prevent storage bloat
  if (sessions.length > 100) {
    sessions.splice(0, sessions.length - 100);
  }
  
  await chrome.storage.local.set({ sessions });
}

// Update total time
async function updateTotalTime(duration) {
  const data = await chrome.storage.local.get(['totalTime']);
  const totalTime = (data.totalTime || 0) + duration;
  await chrome.storage.local.set({ totalTime });
}

// Get statistics
async function getStats() {
  const data = await chrome.storage.local.get(['totalTime', 'sessions', 'isTracking']);
  
  const totalTime = data.totalTime || 0;
  const sessions = data.sessions || [];
  const isTracking = data.isTracking || false;
  
  // Calculate daily stats
  const today = new Date().toDateString();
  const todaySessions = sessions.filter(session => {
    const sessionDate = new Date(session.startTime).toDateString();
    return sessionDate === today;
  });
  
  const todayTime = todaySessions.reduce((total, session) => total + session.duration, 0);
  
  // Calculate weekly stats
  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const weekSessions = sessions.filter(session => session.startTime > weekAgo);
  const weekTime = weekSessions.reduce((total, session) => total + session.duration, 0);
  
  return {
    totalTime,
    todayTime,
    weekTime,
    totalSessions: sessions.length,
    todaySessions: todaySessions.length,
    isTracking,
    currentSession: currentSession
  };
}

// Export data to JSON
async function exportData() {
  try {
    const data = await chrome.storage.local.get(['totalTime', 'sessions', 'settings']);
    
    const exportPayload = {
      exportDate: new Date().toISOString(),
      totalTime: data.totalTime || 0,
      sessions: data.sessions || [],
      settings: data.settings || {},
      summary: {
        totalSessions: data.sessions?.length || 0,
        averageSessionLength: data.sessions?.length > 0 
          ? data.sessions.reduce((total, session) => total + session.duration, 0) / data.sessions.length 
          : 0
      }
    };
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `tubetime-export-${timestamp}.json`;
    
    // Create a data URL instead of blob URL
    const jsonString = JSON.stringify(exportPayload, null, 2);
    const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonString);
    
    try {
      await chrome.downloads.download({
        url: dataUrl,
        filename: filename,
        saveAs: true
      });
      
      return { success: true, message: 'Data exported successfully' };
    } catch (downloadError) {
      console.warn('Download failed, providing data as text:', downloadError);
      
      return { 
        success: true, 
        message: 'Data prepared for export',
        data: jsonString,
        filename: filename
      };
    }
  } catch (error) {
    console.error('Export failed:', error);
    return { success: false, error: error.message };
  }
}

// Clear all data
async function clearData() {
  await chrome.storage.local.clear();
  await initializeStorage();
  return { success: true };
}

// Handle tab updates to detect YouTube navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com')) {
    // Inject content script if needed
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });
  }
});

// Handle tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url && tab.url.includes('youtube.com')) {
    // YouTube tab activated
    // Tab activation detected
  }
}); 