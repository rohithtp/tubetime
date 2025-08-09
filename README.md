# TubeTime - YouTube Time Tracker

A Chrome extension to track your YouTube usage time and export detailed analytics to JSON format.

## Features

### 🕒 Time Tracking
- **Automatic tracking** when you visit YouTube
- **Manual start/stop** control
- **Session-based tracking** with detailed video information
- **Real-time session timer** in the popup
- **Inactivity detection** to pause tracking when you're away

### 📊 Analytics & Statistics
- **Daily, weekly, and total time** spent on YouTube
- **Session count** and average session length
- **Video-by-video tracking** with titles and channel names
- **Real-time statistics** updates

### 📁 Data Export
- **JSON export** with comprehensive data
- **Timestamped exports** for easy organization
- **Detailed session information** including:
  - Video titles and channels
  - Session duration and timestamps
  - Total usage statistics
  - Settings and preferences

### ⚙️ Customization
- **Auto-start tracking** option
- **Daily time limits** to manage usage
- **Export format preferences**
- **Data management** (clear all data)

## Installation

### Method 1: Load Unpacked Extension (Development)

1. **Download or clone** this repository
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable "Developer mode"** (toggle in top right)
4. **Click "Load unpacked"** and select the project folder
5. **Pin the extension** to your toolbar for easy access

### Method 2: Install from Chrome Web Store (Coming Soon)

*This extension will be available on the Chrome Web Store soon.*

## Usage

### Getting Started

1. **Click the TubeTime icon** in your Chrome toolbar
2. **Click "Start Tracking"** to begin monitoring your YouTube usage
3. **Browse YouTube normally** - the extension will track your activity
4. **View real-time statistics** in the popup

### Tracking Features

- **Automatic Detection**: The extension automatically detects when you're on YouTube
- **Video Information**: Tracks video titles, channels, and durations
- **Session Management**: Creates detailed session logs with timestamps
- **Inactivity Pause**: Automatically pauses tracking after 5 minutes of inactivity

### Exporting Data

1. **Click "Export Data"** in the popup
2. **Choose save location** when prompted
3. **JSON file** will be downloaded with format: `tubetime-export-YYYY-MM-DD-HH-MM-SS.json`

### Example Export Data Structure

```json
{
  "exportDate": "2024-01-15T10:30:00.000Z",
  "totalTime": 7200000,
  "sessions": [
    {
      "id": 1705312200000,
      "startTime": 1705312200000,
      "endTime": 1705315800000,
      "duration": 3600000,
      "videos": [
        {
          "id": "dQw4w9WgXcQ",
          "title": "Rick Astley - Never Gonna Give You Up",
          "channel": "Rick Astley",
          "timestamp": 1705312200000,
          "duration": 212
        }
      ]
    }
  ],
  "settings": {
    "autoTrack": true,
    "exportFormat": "json",
    "dailyLimit": 0
  },
  "summary": {
    "totalSessions": 1,
    "averageSessionLength": 3600000
  }
}
```

## Settings

### Auto-Tracking
- **Enabled by default** - starts tracking automatically when YouTube opens
- **Can be disabled** in settings for manual control only

### Daily Limits
- **Set time limits** in minutes (0 = no limit)
- **Helps manage** YouTube usage habits
- **Notifications** when approaching limits

### Export Format
- **JSON format** (default) - comprehensive data structure
- **CSV format** (coming soon) - spreadsheet-friendly format

## Privacy & Data

### Data Storage
- **Local storage only** - all data stays on your device
- **No cloud sync** - your data remains private
- **Chrome storage API** - secure and reliable

### Data Collection
- **Video information** from YouTube pages
- **Session timestamps** and durations
- **User activity** (mouse, keyboard, scroll)
- **No personal data** or account information

### Data Export
- **Complete data export** - all tracked information
- **Timestamped files** - organized by export date
- **JSON format** - easily parseable and readable

## Troubleshooting

### Extension Not Working
1. **Check permissions** - ensure YouTube access is granted
2. **Reload extension** - go to `chrome://extensions/` and click reload
3. **Clear browser cache** - may resolve detection issues
4. **Check console** - open DevTools to see error messages

### Tracking Issues
1. **Verify YouTube URL** - extension only works on `youtube.com`
2. **Check page refresh** - tracking may pause on page reloads
3. **Inactivity detection** - tracking pauses after 5 minutes of no activity
4. **Manual restart** - use start/stop buttons if auto-tracking fails

### Export Problems
1. **Check download permissions** - ensure Chrome can download files
2. **Verify storage** - ensure extension has storage access
3. **Try manual export** - use the export button in popup
4. **Check file size** - large datasets may take time to process

## Development

### Project Structure
```
tubetime/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (background logic)
├── content.js            # Content script (YouTube page logic)
├── popup.html            # Popup interface
├── popup.css             # Popup styles
├── popup.js              # Popup functionality
├── icons/                # Extension icons
└── README.md             # This file
```

### Key Components

#### Background Script (`background.js`)
- **Session management** and time tracking
- **Data storage** and retrieval
- **Export functionality** and file generation
- **Message handling** between components

#### Content Script (`content.js`)
- **YouTube page detection** and video extraction
- **User activity monitoring** and inactivity detection
- **Real-time video information** collection
- **Page navigation** handling

#### Popup Interface (`popup.html/js/css`)
- **User interface** for controlling the extension
- **Real-time statistics** display
- **Settings management** and configuration
- **Data export** and management tools

### Building for Production

1. **Minify JavaScript** files for smaller size
2. **Optimize images** and icons
3. **Update version** in `manifest.json`
4. **Test thoroughly** on different YouTube pages
5. **Package for Chrome Web Store** submission

## Contributing

### Development Setup
1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Test thoroughly** on YouTube
5. **Submit a pull request**

### Code Style
- **ES6+ JavaScript** with modern syntax
- **Consistent formatting** and naming conventions
- **Error handling** for all async operations
- **Comments** for complex logic

### Testing
- **Manual testing** on various YouTube pages
- **Different video types** (regular, live, shorts)
- **Browser compatibility** (Chrome, Edge)
- **Performance testing** with long sessions

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

### Issues and Bugs
- **GitHub Issues** - report bugs and feature requests
- **Detailed descriptions** - include steps to reproduce
- **Browser information** - Chrome version and OS
- **Console logs** - error messages and debugging info

### Feature Requests
- **Use GitHub Issues** for feature requests
- **Describe use case** and expected behavior
- **Consider privacy** and data implications
- **Check existing issues** before creating new ones

---

**TubeTime** - Take control of your YouTube time! 🕒📊 