// Popup script for TubeTime extension

let sessionTimer = null;
let sessionStartTime = null;

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializePopup();
  setupEventListeners();
  loadSettings();
});

// Initialize popup data
async function initializePopup() {
  try {
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
    
  } catch (error) {
    console.error('Error initializing popup:', error);
  }
}

// Set up event listeners
function setupEventListeners() {
  // Start/Stop tracking buttons
  document.getElementById('startBtn').addEventListener('click', startTracking);
  document.getElementById('stopBtn').addEventListener('click', stopTracking);
  
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
    await chrome.runtime.sendMessage({ action: 'startTracking' });
    updateTrackingStatus(true);
    startSessionTimer(Date.now());
    
    // Update button states
    document.getElementById('startBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;
    
  } catch (error) {
    console.error('Error starting tracking:', error);
    showNotification('Failed to start tracking', 'error');
  }
}

// Stop tracking
async function stopTracking() {
  try {
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
    showNotification('Failed to stop tracking', 'error');
  }
}

// Export data
async function exportData() {
  try {
    document.getElementById('exportBtn').disabled = true;
    document.getElementById('exportBtn').textContent = 'Exporting...';
    
    const result = await chrome.runtime.sendMessage({ action: 'exportData' });
    
    if (result.success) {
      if (result.data) {
        // Fallback: show data in a modal or copy to clipboard
        showNotification('Data prepared for export. Check console for data.', 'success');
        console.log('Export data:', result.data);
        console.log('Filename:', result.filename);
        
        // Copy to clipboard if possible
        try {
          await navigator.clipboard.writeText(result.data);
          showNotification('Data copied to clipboard!', 'success');
        } catch (clipboardError) {
          console.log('Clipboard copy failed, data logged to console');
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
    showNotification(`Failed to export data: ${error.message}`, 'error');
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
    showNotification('Failed to clear data', 'error');
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
  const statusDot = document.querySelector('.status-dot');
  const statusText = document.querySelector('.status-text');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  
  if (isTracking) {
    statusDot.classList.add('active');
    statusText.textContent = 'Active';
    startBtn.disabled = true;
    stopBtn.disabled = false;
  } else {
    statusDot.classList.remove('active');
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
  document.getElementById('sessionTime').textContent = '00:00:00';
}

// Update current video display
async function updateCurrentVideo() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    
    if (tab.url && tab.url.includes('youtube.com')) {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getCurrentVideo' });
      
      if (response && response.videoInfo) {
        const videoTitle = document.querySelector('.video-title');
        videoTitle.textContent = response.videoInfo.title || 'Unknown Video';
        videoTitle.title = response.videoInfo.title || 'Unknown Video';
      }
    } else {
      document.querySelector('.video-title').textContent = 'Not on YouTube';
    }
  } catch (error) {
    console.error('Error getting current video:', error);
    document.querySelector('.video-title').textContent = 'Error loading video info';
  }
}

// Format time in HH:MM:SS
function formatTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
    const data = await chrome.storage.local.get(['settings']);
    const settings = data.settings || {};
    
    document.getElementById('autoTrack').checked = settings.autoTrack !== false;
    document.getElementById('dailyLimit').value = settings.dailyLimit || 0;
    document.getElementById('exportFormat').value = settings.exportFormat || 'json';
    
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

async function saveSettings() {
  try {
    const settings = {
      autoTrack: document.getElementById('autoTrack').checked,
      dailyLimit: parseInt(document.getElementById('dailyLimit').value) || 0,
      exportFormat: document.getElementById('exportFormat').value
    };
    
    await chrome.storage.local.set({ settings });
    closeSettings();
    showNotification('Settings saved successfully', 'success');
    
  } catch (error) {
    console.error('Error saving settings:', error);
    showNotification('Failed to save settings', 'error');
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
    const stats = await chrome.runtime.sendMessage({ action: 'getStats' });
    updateStats(stats);
  } catch (error) {
    console.error('Error refreshing stats:', error);
  }
}, 5000); // Refresh every 5 seconds 