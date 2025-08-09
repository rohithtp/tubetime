// Debug script to test button functionality
console.log('🔍 Debugging Timer Buttons...');

// Check if buttons exist
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');

console.log('Start Button:', startBtn);
console.log('Stop Button:', stopBtn);

if (startBtn) {
  console.log('Start Button Properties:');
  console.log('- disabled:', startBtn.disabled);
  console.log('- onclick:', startBtn.onclick);
  console.log('- event listeners:', startBtn.onclick !== null);
  
  // Test click event
  startBtn.addEventListener('click', (e) => {
    console.log('✅ Start button clicked!');
    console.log('Event:', e);
  });
} else {
  console.error('❌ Start button not found!');
}

if (stopBtn) {
  console.log('Stop Button Properties:');
  console.log('- disabled:', stopBtn.disabled);
  console.log('- onclick:', stopBtn.onclick);
  console.log('- event listeners:', stopBtn.onclick !== null);
  
  // Test click event
  stopBtn.addEventListener('click', (e) => {
    console.log('✅ Stop button clicked!');
    console.log('Event:', e);
  });
} else {
  console.error('❌ Stop button not found!');
}

// Check if chrome.runtime is available
console.log('Chrome Runtime:', typeof chrome !== 'undefined' ? chrome.runtime : 'Not available');

// Test message sending
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log('Testing message sending...');
  chrome.runtime.sendMessage({ action: 'getStats' }, (response) => {
    console.log('Stats response:', response);
  });
}

// Check all buttons in the popup
const allButtons = document.querySelectorAll('button');
console.log('All buttons found:', allButtons.length);
allButtons.forEach((btn, index) => {
  console.log(`Button ${index}:`, {
    id: btn.id,
    text: btn.textContent.trim(),
    disabled: btn.disabled,
    className: btn.className
  });
});

// Check if event listeners are properly set up
console.log('Checking event listener setup...');
if (typeof setupEventListeners === 'function') {
  console.log('✅ setupEventListeners function exists');
} else {
  console.error('❌ setupEventListeners function not found');
}

// Test manual function calls
if (typeof startTracking === 'function') {
  console.log('✅ startTracking function exists');
} else {
  console.error('❌ startTracking function not found');
}

if (typeof stopTracking === 'function') {
  console.log('✅ stopTracking function exists');
} else {
  console.error('❌ stopTracking function not found');
}

console.log('🔍 Debug complete. Check console for results.'); 