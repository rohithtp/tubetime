// Popup script for TubeTime extension

let sessionTimer = null;
let sessionStartTime = null;

// Gamification data
let currentXP = 0;
let currentLevel = 1;
let dailyStreak = 0;
let achievements = [];

// Achievement definitions
const ACHIEVEMENTS = [
  {
    id: 'first_session',
    name: 'First Steps',
    description: 'Complete your first tracking session',
    icon: 'play_arrow',
    requirement: 1,
    type: 'sessions'
  },
  {
    id: 'hour_master',
    name: 'Hour Master',
    description: 'Track 1 hour of YouTube time',
    icon: 'schedule',
    requirement: 3600000, // 1 hour in ms
    type: 'total_time'
  },
  {
    id: 'daily_warrior',
    name: 'Daily Warrior',
    description: 'Track YouTube for 7 consecutive days',
    icon: 'calendar_today',
    requirement: 7,
    type: 'streak'
  }
];

// Gamification data
let currentXP = 0;
let currentLevel = 1;
let dailyStreak = 0;
let achievements = [];

// Achievement definitions
const ACHIEVEMENTS = [
  {
    id: 'first_session',
    name: 'First Steps',
    description: 'Complete your first tracking session',
    icon: 'play_arrow',
    requirement: 1,
    type: 'sessions'
  },
  {
    id: 'hour_master',
    name: 'Hour Master',
    description: 'Track 1 hour of YouTube time',
    icon: 'schedule',
    requirement: 3600000, // 1 hour in ms
    type: 'total_time'
  },
  {
    id: 'daily_warrior',
    name: 'Daily Warrior',
    description: 'Track YouTube for 7 consecutive days',
    icon: 'calendar_today',
    requirement: 7,
    type: 'streak'
  },
  {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Track 5 hours in a single week',
    icon: 'weekend',
    requirement: 18000000, // 5 hours in ms
    type: 'week_time'
  },
  {
    id: 'marathon_runner',
    name: 'Marathon Runner',
    description: 'Track 10 hours total',
    icon: 'directions_run',
    requirement: 36000000, // 10 hours in ms
    type: 'total_time'
  },
  {
    id: 'dedicated_viewer',
    name: 'Dedicated Viewer',
    description: 'Complete 50 tracking sessions',
    icon: 'repeat',
    requirement: 50,
    type: 'sessions'
  }
];

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    initializePopup();
    setupEventListeners();
    loadSettings();
    loadGamificationData();
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
    
    // Load gamification data
    await loadGamificationData();
    
  } catch (error) {
    console.error('Error initializing popup:', error);
    if (error.message.includes('Extension context invalidated')) {
      showNotification('Extension needs to be reloaded', 'error');
    }
  }
}

// Load gamification data
async function loadGamificationData() {
  try {
    const data = await chrome.storage.local.get(['xp', 'level', 'streak', 'achievements', 'lastActiveDate']);
    
    currentXP = data.xp || 0;
    currentLevel = data.level || 1;
    dailyStreak = data.streak || 0;
    achievements = data.achievements || [];
    
    // Check for streak continuation
    const today = new Date().toDateString();
    const lastActive = data.lastActiveDate;
    
    if (lastActive && lastActive !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();
      
      if (lastActive === yesterdayStr) {
        // Streak continues
        dailyStreak++;
      } else {
        // Streak broken
        dailyStreak = 0;
      }
    }
    
    updateGamificationUI();
    renderAchievements();
    
  } catch (error) {
    console.error('Error loading gamification data:', error);
  }
}

// Update gamification UI
function updateGamificationUI() {
  // Update level display
  document.getElementById('currentLevel').textContent = currentLevel;
  document.getElementById('levelNumber').textContent = currentLevel;
  
  // Calculate XP progress
  const xpForNextLevel = currentLevel * 1000;
  const xpProgress = (currentXP % 1000) / 1000 * 100;
  
  // Update XP display
  document.getElementById('xpDisplay').textContent = `${currentXP} XP`;
  document.getElementById('xpProgress').style.width = `${xpProgress}%`;
  document.getElementById('xpToNext').textContent = `${currentXP % 1000} / 1000 XP`;
  
  // Update streak display
  document.getElementById('streakCount').textContent = `${dailyStreak} days`;
  
  // Update streak flame animation
  const streakFlame = document.getElementById('streakFlame');
  if (dailyStreak > 0) {
    streakFlame.style.animation = 'flame 1.5s infinite';
  } else {
    streakFlame.style.animation = 'none';
  }
}

// Render achievements
function renderAchievements() {
  const achievementsGrid = document.getElementById('achievementsGrid');
  achievementsGrid.innerHTML = '';
  
  ACHIEVEMENTS.forEach(achievement => {
    const isUnlocked = achievements.includes(achievement.id);
    const achievementElement = document.createElement('div');
    achievementElement.className = `achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`;
    achievementElement.innerHTML = `
      <div class="achievement-icon">
        <span class="material-icons">${achievement.icon}</span>
      </div>
      <div class="achievement-name">${achievement.name}</div>
    `;
    
    achievementElement.addEventListener('click', () => {
      showAchievementDetails(achievement, isUnlocked);
    });
    
    achievementsGrid.appendChild(achievementElement);
  });
}

// Show achievement details
function showAchievementDetails(achievement, isUnlocked) {
  const message = isUnlocked 
    ? `Achievement Unlocked: ${achievement.name}\n${achievement.description}`
    : `Achievement: ${achievement.name}\n${achievement.description}\n\nKeep tracking to unlock this achievement!`;
  
  showNotification(message, isUnlocked ? 'success' : 'info');
}

// Award XP
function awardXP(amount) {
  currentXP += amount;
  
  // Check for level up
  const newLevel = Math.floor(currentXP / 1000) + 1;
  if (newLevel > currentLevel) {
    currentLevel = newLevel;
    showLevelUpNotification();
  }
  
  updateGamificationUI();
  saveGamificationData();
}

// Show level up notification
function showLevelUpNotification() {
  const notification = document.createElement('div');
  notification.className = 'level-up-notification';
  notification.innerHTML = `
    <div class="level-up-content">
      <span class="material-icons">star</span>
      <div class="level-up-text">
        <h4>Level Up!</h4>
        <p>You reached Level ${currentLevel}!</p>
      </div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Check achievements
async function checkAchievements(stats) {
  const newAchievements = [];
  
  ACHIEVEMENTS.forEach(achievement => {
    if (!achievements.includes(achievement.id)) {
      let unlocked = false;
      
      switch (achievement.type) {
        case 'sessions':
          unlocked = stats.totalSessions >= achievement.requirement;
          break;
        case 'total_time':
          unlocked = stats.totalTime >= achievement.requirement;
          break;
        case 'streak':
          unlocked = dailyStreak >= achievement.requirement;
          break;
        case 'week_time':
          unlocked = stats.weekTime >= achievement.requirement;
          break;
      }
      
      if (unlocked) {
        newAchievements.push(achievement);
        achievements.push(achievement.id);
      }
    }
  });
  
  if (newAchievements.length > 0) {
    newAchievements.forEach(achievement => {
      showAchievementUnlocked(achievement);
    });
    
    renderAchievements();
    saveGamificationData();
  }
}

// Show achievement unlocked toast
function showAchievementUnlocked(achievement) {
  const toast = document.getElementById('achievementToast');
  const title = document.getElementById('achievementTitle');
  const desc = document.getElementById('achievementDesc');
  
  title.textContent = achievement.name;
  desc.textContent = achievement.description;
  
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

// Save gamification data
async function saveGamificationData() {
  try {
    await chrome.storage.local.set({
      xp: currentXP,
      level: currentLevel,
      streak: dailyStreak,
      achievements: achievements,
      lastActiveDate: new Date().toDateString()
    });
  } catch (error) {
    console.error('Error saving gamification data:', error);
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
    
    const response = await chrome.runtime.sendMessage({ action: 'startTracking' });
    
    if (response.success) {
      document.getElementById('startBtn').disabled = true;
      document.getElementById('stopBtn').disabled = false;
      
      // Start session timer
      startSessionTimer(Date.now());
      updateTrackingStatus(true);
      
      // Award XP for starting tracking
      awardXP(10);
      
      showNotification('Tracking started!', 'success');
    } else {
      showNotification('Failed to start tracking', 'error');
    }
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
    
    const response = await chrome.runtime.sendMessage({ action: 'stopTracking' });
    
    if (response.success) {
      document.getElementById('startBtn').disabled = false;
      document.getElementById('stopBtn').disabled = true;
      
      // Stop session timer
      stopSessionTimer();
      updateTrackingStatus(false);
      
      // Award XP for completing session
      const sessionDuration = Date.now() - sessionStartTime;
      const xpEarned = Math.floor(sessionDuration / 60000); // 1 XP per minute
      if (xpEarned > 0) {
        awardXP(xpEarned);
        showNotification(`Session completed! Earned ${xpEarned} XP`, 'success');
      }
      
      // Check achievements
      const stats = await chrome.runtime.sendMessage({ action: 'getStats' });
      checkAchievements(stats);
      
    } else {
      showNotification('Failed to stop tracking', 'error');
    }
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
    
    const response = await chrome.runtime.sendMessage({ action: 'exportData' });
    
    if (response.success) {
      if (response.data) {
        // Create and download file
        const blob = new Blob([response.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.filename || 'tubetime-export.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      showNotification('Data exported successfully!', 'success');
    } else {
      showNotification('Failed to export data', 'error');
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    if (error.message.includes('Extension context invalidated')) {
      showNotification('Extension needs to be reloaded', 'error');
    } else {
      showNotification('Failed to export data', 'error');
    }
  } finally {
    document.getElementById('exportBtn').disabled = false;
    document.getElementById('exportBtn').innerHTML = `
      <span class="material-icons">download</span>
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
    
    const response = await chrome.runtime.sendMessage({ action: 'clearData' });
    
    if (response.success) {
      // Reset gamification data
      currentXP = 0;
      currentLevel = 1;
      dailyStreak = 0;
      achievements = [];
      
      updateGamificationUI();
      renderAchievements();
      saveGamificationData();
      
      showNotification('Data cleared successfully!', 'success');
      
      // Refresh stats display
      const stats = await chrome.runtime.sendMessage({ action: 'getStats' });
      updateStats(stats);
    } else {
      showNotification('Failed to clear data', 'error');
    }
  } catch (error) {
    console.error('Error clearing data:', error);
    if (error.message.includes('Extension context invalidated')) {
      showNotification('Extension needs to be reloaded', 'error');
    } else {
      showNotification('Failed to clear data', 'error');
    }
  }
}

// Update stats display
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
  document.getElementById('sessionTime').textContent = '0s';
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
    
    if (tab && tab.url && tab.url.includes('youtube.com')) {
      try {
        // Send refresh message to content script
        await chrome.tabs.sendMessage(tab.id, { action: 'refreshVideoInfo' });
        
        // Wait a moment for content script to update
        setTimeout(async () => {
          try {
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'getCurrentVideo' });
            
            if (response && response.videoInfo) {
              const videoTitle = document.querySelector('.video-title');
              videoTitle.textContent = response.videoInfo.title || 'Unknown Video';
              videoTitle.title = response.videoInfo.title || 'Unknown Video';
            } else {
              document.querySelector('.video-title').textContent = 'YouTube page detected';
            }
          } catch (messageError) {
            document.querySelector('.video-title').textContent = 'Not on YouTube';
          }
        }, 500);
        
      } catch (messageError) {
        document.querySelector('.video-title').textContent = 'YouTube page detected';
      }
    } else {
      document.querySelector('.video-title').textContent = 'Not on YouTube';
    }
  } catch (error) {
    console.error('Error refreshing video info:', error);
    if (error.message.includes('Extension context invalidated')) {
      document.querySelector('.video-title').textContent = 'Extension needs reload';
    } else {
      document.querySelector('.video-title').textContent = 'Error refreshing video info';
    }
  } finally {
    // Reset refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.disabled = false;
    refreshBtn.innerHTML = `
      <span class="material-icons">refresh</span>
    `;
  }
}

// Toggle auto tracking
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
    showNotification(`Switched to ${mode} mode`, 'success');
    
    // If switching to manual mode and currently tracking, stop tracking
    if (!isAutoTracking && document.getElementById('stopBtn').disabled === false) {
      await stopTracking();
    }
    
    // Notify content script about the change
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      
      if (tab && tab.url && tab.url.includes('youtube.com')) {
        await chrome.tabs.sendMessage(tab.id, { action: 'checkAutoTracking' });
      }
    } catch (error) {
      // Content script might not be available, which is fine
    }
    
  } catch (error) {
    console.error('Error toggling auto tracking:', error);
    if (error.message.includes('Extension context invalidated')) {
      showNotification('Extension needs to be reloaded', 'error');
    } else {
      showNotification('Failed to update auto tracking setting', 'error');
    }
    
    // Revert toggle state
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
    
    // Set toggle state (default to true if not set)
    autoTrackToggle.checked = settings.autoTrack !== false;
    
  } catch (error) {
    console.error('Error loading auto tracking setting:', error);
    if (error.message.includes('Extension context invalidated')) {
      showNotification('Extension needs to be reloaded', 'error');
    } else {
      // Set default value
      document.getElementById('autoTrackToggle').checked = true;
    }
  }
}

// Format time with precision
function formatTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  // Show hours, minutes, and seconds for precision
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
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
  notification.innerHTML = `
    <div class="notification-content">
      <span class="material-icons notification-icon">${getNotificationIcon(type)}</span>
      <span class="notification-text">${message}</span>
    </div>
  `;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Show notification
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  // Hide and remove after delay
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 4000);
}

function getNotificationIcon(type) {
  switch (type) {
    case 'success': return 'check_circle';
    case 'error': return 'error';
    case 'warning': return 'warning';
    default: return 'info';
  }
}

// Gamification functions
async function loadGamificationData() {
  try {
    const data = await chrome.storage.local.get(['xp', 'level', 'streak', 'achievements', 'lastActiveDate']);
    
    currentXP = data.xp || 0;
    currentLevel = data.level || 1;
    dailyStreak = data.streak || 0;
    achievements = data.achievements || [];
    
    updateGamificationUI();
    renderAchievements();
    
  } catch (error) {
    console.error('Error loading gamification data:', error);
  }
}

function updateGamificationUI() {
  // Update level display
  document.getElementById('currentLevel').textContent = currentLevel;
  document.getElementById('levelNumber').textContent = currentLevel;
  
  // Calculate XP progress
  const xpProgress = (currentXP % 1000) / 1000 * 100;
  
  // Update XP display
  document.getElementById('xpDisplay').textContent = `${currentXP} XP`;
  document.getElementById('xpProgress').style.width = `${xpProgress}%`;
  document.getElementById('xpToNext').textContent = `${currentXP % 1000} / 1000 XP`;
  
  // Update streak display
  document.getElementById('streakCount').textContent = `${dailyStreak} days`;
}

function renderAchievements() {
  const achievementsGrid = document.getElementById('achievementsGrid');
  achievementsGrid.innerHTML = '';
  
  ACHIEVEMENTS.forEach(achievement => {
    const isUnlocked = achievements.includes(achievement.id);
    const achievementElement = document.createElement('div');
    achievementElement.className = `achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`;
    achievementElement.innerHTML = `
      <div class="achievement-icon">
        <span class="material-icons">${achievement.icon}</span>
      </div>
      <div class="achievement-name">${achievement.name}</div>
    `;
    
    achievementsGrid.appendChild(achievementElement);
  });
}

function awardXP(amount) {
  currentXP += amount;
  
  // Check for level up
  const newLevel = Math.floor(currentXP / 1000) + 1;
  if (newLevel > currentLevel) {
    currentLevel = newLevel;
    showLevelUpNotification();
  }
  
  updateGamificationUI();
  saveGamificationData();
}

function showLevelUpNotification() {
  showNotification(`🎉 Level Up! You reached Level ${currentLevel}!`, 'success');
}

async function saveGamificationData() {
  try {
    await chrome.storage.local.set({
      xp: currentXP,
      level: currentLevel,
      streak: dailyStreak,
      achievements: achievements,
      lastActiveDate: new Date().toDateString()
    });
  } catch (error) {
    console.error('Error saving gamification data:', error);
  }
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