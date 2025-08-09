# TubeTime Installation Guide

## Quick Start

### Prerequisites
- Google Chrome browser (version 88 or later)
- Access to YouTube.com

### Installation Steps

1. **Download the Extension**
   - Clone or download this repository to your computer
   - Extract the files if downloaded as a ZIP

2. **Generate Icons (Required)**
   ```bash
   # Run the icon generation script
   node generate-icons.js
   
   # Follow the instructions to create PNG icons:
   # - Use an online converter like https://convertio.co/svg-png/
   # - Upload icons/icon.svg and convert to 16x16, 48x48, and 128x128 PNG
   # - Save as icons/icon16.png, icons/icon48.png, icons/icon128.png
   ```

3. **Load Extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked" button
   - Select the folder containing the extension files
   - The extension should appear in your extensions list

4. **Pin the Extension**
   - Click the puzzle piece icon in Chrome toolbar
   - Find "TubeTime" and click the pin icon
   - The TubeTime icon will now appear in your toolbar

5. **Test the Extension**
   - Go to YouTube.com
   - Click the TubeTime icon in your toolbar
   - Click "Start Tracking" to begin monitoring

## Troubleshooting

### Extension Won't Load
- **Check file structure**: Ensure all required files are present
- **Validate manifest**: Run `node test-extension.js` to check for issues
- **Check console**: Open DevTools (F12) and look for error messages
- **Reload extension**: Go to `chrome://extensions/` and click the reload button

### Icons Missing
- **Generate icons**: Follow the instructions in `generate-icons.js`
- **Check file names**: Icons must be named exactly `icon16.png`, `icon48.png`, `icon128.png`
- **Verify format**: Icons must be PNG format

### Tracking Not Working
- **Check permissions**: Ensure the extension has access to YouTube
- **Verify URL**: Extension only works on `youtube.com` domains
- **Refresh page**: Try refreshing the YouTube page
- **Check console**: Look for error messages in DevTools

### Export Issues
- **Check download permissions**: Ensure Chrome can download files
- **Verify storage**: Check that the extension has storage access
- **Try manual export**: Use the export button in the popup

## Development Installation

### For Developers
1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/tubetime.git
   cd tubetime
   ```

2. **Install dependencies** (if any)
   ```bash
   npm install
   ```

3. **Validate the extension**
   ```bash
   node test-extension.js
   ```

4. **Generate icons**
   ```bash
   node generate-icons.js
   # Follow the instructions to create PNG icons
   ```

5. **Load in Chrome**
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked" and select the project folder

### Making Changes
- **Edit files**: Modify the JavaScript, HTML, or CSS files
- **Reload extension**: Click the reload button in `chrome://extensions/`
- **Test changes**: Visit YouTube and test the functionality
- **Check console**: Use DevTools to debug any issues

## File Structure
```
tubetime/
├── manifest.json          # Extension configuration
├── background.js          # Background service worker
├── content.js            # Content script for YouTube
├── popup.html            # Popup interface
├── popup.css             # Popup styles
├── popup.js              # Popup functionality
├── icons/                # Extension icons
│   ├── icon.svg          # Source SVG icon
│   ├── icon16.png        # 16x16 PNG icon (required)
│   ├── icon48.png        # 48x48 PNG icon (required)
│   └── icon128.png       # 128x128 PNG icon (required)
├── README.md             # Project documentation
├── INSTALLATION.md       # This file
├── package.json          # Project metadata
├── generate-icons.js     # Icon generation script
└── test-extension.js     # Validation script
```

## Browser Compatibility

### Supported Browsers
- **Google Chrome** (version 88+)
- **Microsoft Edge** (version 88+)
- **Other Chromium-based browsers**

### Not Supported
- **Firefox** (requires different manifest format)
- **Safari** (requires different extension format)
- **Internet Explorer** (not supported)

## Security Notes

### Permissions
The extension requests the following permissions:
- **storage**: To save tracking data locally
- **activeTab**: To access YouTube pages
- **scripting**: To inject content scripts
- **downloads**: To export data as JSON files

### Data Privacy
- **Local storage only**: All data stays on your device
- **No cloud sync**: Your data remains private
- **No tracking**: The extension doesn't send data anywhere
- **Open source**: Code is transparent and auditable

## Support

### Getting Help
1. **Check this guide** for common issues
2. **Run validation**: `node test-extension.js`
3. **Check console**: Use DevTools for error messages
4. **GitHub Issues**: Report bugs and feature requests

### Common Issues
- **Extension not loading**: Check file structure and manifest
- **Icons missing**: Generate PNG icons from SVG
- **Tracking not working**: Verify YouTube URL and permissions
- **Export failing**: Check download permissions and storage

---

**Need help?** Check the main README.md for more detailed documentation. 