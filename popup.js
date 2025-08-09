// Popup script for TubeTime extension

let sessionTimer = null;
let sessionStartTime = null;

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    initializePopup();
    setupEventListeners();
    loadSettings();
  } catch (error) {
    console.error('Error initializing popup:', error);
    // Handle extension context invalidation
    if (error.message.includes('Extension context invalidated')) {
      showNotification('Extension needs to be reloaded', 'error');
    }
  }
});

// Initialize popup data
async function initializePopup() {
  try {
    // Check if extension context is valid
    if (!chrome.runtime?.id) {
      throw new Error('Extension context invalidated');
    }
    
    // Get current stats
    const stats = await chrome.runtime.sendMessage({ action: 'getStats' });
    updateStats(stats);
    
    // Update session timer if tracking is active
    if (stats.isTracking && stats.currentSession) {
      startSessionTimer(stats.currentSession.startTime);
      updateTrackingStatus(true);
    } else {
      updateTrackingStatus(false);
    }
    
    // Get current video info from content script
    updateCurrentVideo();
    
    // Load auto-tracking setting
    await loadAutoTrackingSetting();
    
  } catch (error) {
    console.error('Error initializing popup:', error);
    if (error.message.includes('Extension context invalidated')) {
      showNotification('Extension needs to be reloaded', 'error');
    }
  }
}

// Set up event listeners
function setupEventListeners() {
  // Start/Stop tracking buttons
  document.getElementById('startBtn').addEventListener('click', startTracking);
  document.getElementById('stopBtn').addEventListener('click', stopTracking);
  
  // Refresh button
  document.getElementById('refreshBtn').addEventListener('click', refreshCurrentVideo);
  
  // Auto tracking toggle
  document.getElementById('autoTrackToggle').addEventListener('change', toggleAutoTracking);
  
  // Action buttons
  document.getElementById('exportBtn').addEventListener('click', exportData);
  document.getElementById('settingsBtn').addEventListener('click', openSettings);
  document.getElementById('clearBtn').addEventListener('click', () => {
    showConfirmModal('Are you sure you want to clear all tracking data? This action cannot be undone.', clearData);
  });
  
  // Settings modal
  document.getElementById('closeSettings').addEventListener('click', closeSettings);
  document.getElementById('cancelSettings').addEventListener('click', closeSettings);
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  
  // Confirmation modal
  document.getElementById('closeConfirm').addEventListener('click', closeConfirmModal);
  document.getElementById('cancelConfirm').addEventListener('click', closeConfirmModal);
  document.getElementById('confirmAction').addEventListener('click', executeConfirmedAction);
  
  // Close modals when clicking outside
  document.getElementById('settingsModal').addEventListener('click', (e) => {
    if (e.target.id === 'settingsModal') closeSettings();
  });
  
  document.getElementById('confirmModal').addEventListener('click', (e) => {
    if (e.target.id === 'confirmModal') closeConfirmModal();
  });
}

// Start tracking
async function startTracking() {
  try {
    // Check if extension context is valid
    if (!chrome.runtime?.id) {
      throw new Error('Extension context invalidated');
    }
    
    await chrome.runtime.sendMessage({ action: 'startTracking' });
    updateTrackingStatus(true);
    startSessionTimer(Date.now());
    
    // Update button states
    document.getElementById('startBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;
    
  } catch (error) {
    console.error('Error starting tracking:', error);
    if (error.message.includes('Extension context invalidated')) {
      showNotification('Extension needs to be reloaded', 'error');
    } else {
      showNotification('Failed to start tracking', 'error');
    }
  }
}

// Stop tracking
async function stopTracking() {
  try {
    // Check if extension context is valid
    if (!chrome.runtime?.id) {
      throw new Error('Extension context invalidated');
    }
    
    await chrome.runtime.sendMessage({ action: 'stopTracking' });
    updateTrackingStatus(false);
    stopSessionTimer();
    
    // Update button states
    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
    
    // Refresh stats
    const stats = await chrome.runtime.sendMessage({ action: 'getStats' });
    updateStats(stats);
    
    showNotification('Tracking stopped', 'success');
    
  } catch (error) {
    console.error('Error stopping tracking:', error);
    if (error.message.includes('Extension context invalidated')) {
      showNotification('Extension needs to be reloaded', 'error');
    } else {
      showNotification('Failed to stop tracking', 'error');
    }
  }
}

// Export data
async function exportData() {
  try {
    // Check if extension context is valid
    if (!chrome.runtime?.id) {
      throw new Error('Extension context invalidated');
    }
    
    document.getElementById('exportBtn').disabled = true;
    document.getElementById('exportBtn').textContent = 'Exporting...';
    
    const result = await chrome.runtime.sendMessage({ action: 'exportData' });
    
    if (result.success) {
      if (result.data) {
        // Fallback: show data in a modal or copy to clipboard
        showNotification('Data prepared for export. Check console for data.', 'success');
        
        // Copy to clipboard if possible
        try {
          await navigator.clipboard.writeText(result.data);
          showNotification('Data copied to clipboard!', 'success');
        } catch (clipboardError) {
          // Clipboard copy failed
        }
      } else {
        showNotification('Data exported successfully! Check your downloads folder.', 'success');
      }
    } else {
      const errorMessage = result.error || 'Unknown error occurred';
      console.error('Export failed:', errorMessage);
      showNotification(`Failed to export data: ${errorMessage}`, 'error');
    }
    
  } catch (error) {
    console.error('Error exporting data:', error);
    if (error.message.includes('Extension context invalidated')) {
      showNotification('Extension needs to be reloaded', 'error');
    } else {
      showNotification(`Failed to export data: ${error.message}`, 'error');
    }
  } finally {
    document.getElementById('exportBtn').disabled = false;
    document.getElementById('exportBtn').innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>
      </svg>
      Export Data
    `;
  }
}

// Clear data
async function clearData() {
  try {
    // Check if extension context is valid
    if (!chrome.runtime?.id) {
      throw new Error('Extension context invalidated');
    }
    
    await chrome.runtime.sendMessage({ action: 'clearData' });
    updateStats({
      totalTime: 0,
      todayTime: 0,
      weekTime: 0,
      totalSessions: 0,
      todaySessions: 0,
      isTracking: false
    });
    showNotification('Data cleared successfully', 'success');
  } catch (error) {
    console.error('Error clearing data:', error);
    if (error.message.includes('Extension context invalidated')) {
      showNotification('Extension needs to be reloaded', 'error');
    } else {
      showNotification('Failed to clear data', 'error');
    }
  }
}

// Update statistics display
function updateStats(stats) {
  document.getElementById('totalTime').textContent = formatTime(stats.totalTime);
  document.getElementById('todayTime').textContent = formatTime(stats.todayTime);
  document.getElementById('weekTime').textContent = formatTime(stats.weekTime);
  document.getElementById('totalSessions').textContent = stats.totalSessions;
}

// Update tracking status
function updateTrackingStatus(isTracking) {
  const statusIcon = document.querySelector('.status-icon');
  const statusText = document.querySelector('.status-text');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  
  if (isTracking) {
    statusIcon.classList.add('active');
    statusText.textContent = 'Active';
    startBtn.disabled = true;
    stopBtn.disabled = false;
  } else {
    statusIcon.classList.remove('active');
    statusText.textContent = 'Inactive';
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
}

// Start session timer
function startSessionTimer(startTime) {
  sessionStartTime = startTime;
  
  if (sessionTimer) {
    clearInterval(sessionTimer);
  }
  
  sessionTimer = setInterval(() => {
    const elapsed = Date.now() - sessionStartTime;
    document.getElementById('sessionTime').textContent = formatTime(elapsed);
  }, 1000);
}

// Stop session timer
function stopSessionTimer() {
  if (sessionTimer) {
    clearInterval(sessionTimer);
    sessionTimer = null;
  }
  document.getElementById('sessionTime').textContent = '0m';
}

// Update current video display
async function updateCurrentVideo() {
  try {
    // Check if extension context is valid
    if (!chrome.runtime?.id) {
      throw new Error('Extension context invalidated');
    }
    
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    
    if (!tab || !tab.url) {
      document.querySelector('.video-title').textContent = 'No active tab';
      return;
    }
    
    if (tab.url && tab.url.includes('youtube.com')) {
      try {
        // Try to inject content script if not already injected
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
      } catch (injectionError) {
        // Content script might already be injected, which is fine
      }
      
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'getCurrentVideo' });
        
        if (response && response.videoInfo) {
          const videoTitle = document.querySelector('.video-title');
          videoTitle.textContent = response.videoInfo.title || 'Unknown Video';
          videoTitle.title = response.videoInfo.title || 'Unknown Video';
        } else {
          document.querySelector('.video-title').textContent = 'No video playing';
        }
      } catch (messageError) {
        // Content script not available or not responding
        document.querySelector('.video-title').textContent = 'YouTube page detected';
      }
    } else {
      document.querySelector('.video-title').textContent = 'Not on YouTube';
    }
  } catch (error) {
    console.error('Error getting current video:', error);
    if (error.message.includes('Extension context invalidated')) {
      document.querySelector('.video-title').textContent = 'Extension needs reload';
    } else if (error.message.includes('Could not establish connection')) {
      document.querySelector('.video-title').textContent = 'YouTube page detected';
    } else {
      document.querySelector('.video-title').textContent = 'Error loading video info';
    }
  }
}

// Refresh current video information
async function refreshCurrentVideo() {
  try {
    // Check if extension context is valid
    if (!chrome.runtime?.id) {
      throw new Error('Extension context invalidated');
    }
    
    const refreshBtn = document.getElementById('refreshBtn');
    
    // Show loading state
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="animation: spin 1s linear infinite;">
        <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>
      </svg>
    `;
    
    // Get current tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    
    if (!tab || !tab.url) {
      showNotification('No active tab found', 'warning');
      return;
    }
    
    if (tab.url && tab.url.includes('youtube.com')) {
      try {
        // Try to inject content script if not already injected
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
      } catch (injectionError) {
        // Content script might already be injected, which is fine
      }
      
      try {
        // Send message to content script to force refresh
        await chrome.tabs.sendMessage(tab.id, { action: 'refreshVideoInfo' });
        
        // Wait a moment for the content script to process
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get updated video info
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'getCurrentVideo' });
        
        if (response && response.videoInfo) {
          const videoTitle = document.querySelector('.video-title');
          videoTitle.textContent = response.videoInfo.title || 'Unknown Video';
          videoTitle.title = response.videoInfo.title || 'Unknown Video';
          showNotification('Video info refreshed successfully', 'success');
        } else {
          showNotification('No video information found', 'warning');
        }
      } catch (messageError) {
        // Content script not available or not responding
        showNotification('YouTube page detected (content script not responding)', 'info');
        document.querySelector('.video-title').textContent = 'YouTube page detected';
      }
    } else {
      document.querySelector('.video-title').textContent = 'Not on YouTube';
      showNotification('Not on a YouTube page', 'warning');
    }
    
  } catch (error) {
    console.error('Error refreshing video info:', error);
    if (error.message.includes('Extension context invalidated')) {
      showNotification('Extension needs to be reloaded', 'error');
    } else if (error.message.includes('Could not establish connection')) {
      showNotification('YouTube page detected (connection issue)', 'info');
    } else {
      showNotification('Failed to refresh video info', 'error');
    }
  } finally {
    // Restore button state
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.disabled = false;
    refreshBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>
      </svg>
    `;
  }
}

// Toggle auto tracking mode
async function toggleAutoTracking() {
  try {
    // Check if extension context is valid
    if (!chrome.runtime?.id) {
      throw new Error('Extension context invalidated');
    }
    
    const autoTrackToggle = document.getElementById('autoTrackToggle');
    const isAutoTracking = autoTrackToggle.checked;
    
    // Update settings in storage
    const data = await chrome.storage.local.get(['settings']);
    const settings = data.settings || {};
    settings.autoTrack = isAutoTracking;
    
    await chrome.storage.local.set({ settings });
    
    // Show notification
    const mode = isAutoTracking ? 'Automatic' : 'Manual';
    showNotification(`Tracking mode set to ${mode}`, 'success');
    
    // If switching to manual mode and currently tracking, stop tracking
    if (!isAutoTracking && document.getElementById('stopBtn').disabled === false) {
      await stopTracking();
      showNotification('Tracking stopped (manual mode enabled)', 'info');
    }
    
    // Notify content script about the setting change
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      
      if (tab && tab.url && tab.url.includes('youtube.com')) {
        try {
          // Try to inject content script if not already injected
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          
          // Send message to content script
          await chrome.tabs.sendMessage(tab.id, { action: 'checkAutoTracking' });
        } catch (messageError) {
          // Content script not available or not responding, which is fine
        }
      }
    } catch (error) {
      // Tab query failed, which is fine
    }
    
  } catch (error) {
    console.error('Error toggling auto tracking:', error);
    if (error.message.includes('Extension context invalidated')) {
      showNotification('Extension needs to be reloaded', 'error');
    } else {
      showNotification('Failed to update tracking mode', 'error');
    }
    
    // Revert toggle state on error
    const autoTrackToggle = document.getElementById('autoTrackToggle');
    autoTrackToggle.checked = !autoTrackToggle.checked;
  }
}

// Load auto tracking setting
async function loadAutoTrackingSetting() {
  try {
    // Check if extension context is valid
    if (!chrome.runtime?.id) {
      throw new Error('Extension context invalidated');
    }
    
    const data = await chrome.storage.local.get(['settings']);
    const settings = data.settings || {};
    const autoTrackToggle = document.getElementById('autoTrackToggle');
    
    // Set toggle state based on stored setting (default to true)
    autoTrackToggle.checked = settings.autoTrack !== false;
    
  } catch (error) {
    console.error('Error loading auto tracking setting:', error);
    if (error.message.includes('Extension context invalidated')) {
      showNotification('Extension needs to be reloaded', 'error');
    }
    // Default to auto tracking enabled
    document.getElementById('autoTrackToggle').checked = true;
  }
}

// Format time in HH:MM:SS
function formatTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  // Simple format: show hours and minutes only
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

// Settings functions
function openSettings() {
  document.getElementById('settingsModal').classList.add('show');
  loadSettings();
}

function closeSettings() {
  document.getElementById('settingsModal').classList.remove('show');
}

async function loadSettings() {
  try {
    // Check if extension context is valid
    if (!chrome.runtime?.id) {
      throw new Error('Extension context invalidated');
    }
    
    const data = await chrome.storage.local.get(['settings']);
    const settings = data.settings || {};
    
    document.getElementById('autoTrack').checked = settings.autoTrack !== false;
    document.getElementById('dailyLimit').value = settings.dailyLimit || 0;
    document.getElementById('exportFormat').value = settings.exportFormat || 'json';
    
    // Also update the main toggle to stay in sync
    document.getElementById('autoTrackToggle').checked = settings.autoTrack !== false;
    
  } catch (error) {
    console.error('Error loading settings:', error);
    if (error.message.includes('Extension context invalidated')) {
      showNotification('Extension needs to be reloaded', 'error');
    }
  }
}

async function saveSettings() {
  try {
    // Check if extension context is valid
    if (!chrome.runtime?.id) {
      throw new Error('Extension context invalidated');
    }
    
    const settings = {
      autoTrack: document.getElementById('autoTrack').checked,
      dailyLimit: parseInt(document.getElementById('dailyLimit').value) || 0,
      exportFormat: document.getElementById('exportFormat').value
    };
    
    await chrome.storage.local.set({ settings });
    
    // Update the main toggle to stay in sync
    document.getElementById('autoTrackToggle').checked = settings.autoTrack;
    
    closeSettings();
    showNotification('Settings saved successfully', 'success');
    
  } catch (error) {
    console.error('Error saving settings:', error);
    if (error.message.includes('Extension context invalidated')) {
      showNotification('Extension needs to be reloaded', 'error');
    } else {
      showNotification('Failed to save settings', 'error');
    }
  }
}

// Confirmation modal functions
let confirmedAction = null;

function showConfirmModal(message, action) {
  document.getElementById('confirmMessage').textContent = message;
  document.getElementById('confirmModal').classList.add('show');
  confirmedAction = action;
}

function closeConfirmModal() {
  document.getElementById('confirmModal').classList.remove('show');
  confirmedAction = null;
}

function executeConfirmedAction() {
  if (confirmedAction) {
    confirmedAction();
  }
  closeConfirmModal();
}

// Notification system
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Style the notification
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    border-radius: 6px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    animation: slideIn 0.3s ease;
    max-width: 300px;
  `;
  
  // Set background color based on type
  switch (type) {
    case 'success':
      notification.style.background = '#28a745';
      break;
    case 'error':
      notification.style.background = '#dc3545';
      break;
    case 'warning':
      notification.style.background = '#ffc107';
      notification.style.color = '#212529';
      break;
    default:
      notification.style.background = '#17a2b8';
  }
  
  // Add to page
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Add notification animations to CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Refresh data periodically
setInterval(async () => {
  try {
    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
      console.log('Extension context invalidated, stopping periodic refresh');
      return;
    }
    
    const stats = await chrome.runtime.sendMessage({ action: 'getStats' });
    updateStats(stats);
  } catch (error) {
    console.error('Error refreshing stats:', error);
    // If context is invalidated, stop trying to refresh
    if (error.message.includes('Extension context invalidated')) {
      console.log('Extension context invalidated, stopping periodic refresh');
      return;
    }
  }
}, 5000); // Refresh every 5 seconds 