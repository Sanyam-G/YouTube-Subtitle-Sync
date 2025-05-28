# YouTube Subtitle Sync Refresher

This script fixes lagging, skipping, or out-of-sync YouTube subtitles when watching at fast playback speeds (e.g., 2x, 3x).

## How It Works

When your YouTube video playback speed is faster than a set value (default 2.7x):
1.  The script finds YouTube's video player.
2.  Every few seconds (configurable), it quickly turns captions off and then on again.
3.  This quick toggle forces YouTube's captions to re-sync.
4.  It also tries to hide the caption toggle pop-up message (e.g., "English (auto-generated)").

## How to Install

1.  **Get a Userscript Manager:** Install a browser extension like Tampermonkey (or Violentmonkey/Greasemonkey).
2.  **Install This Script:**
    * Navigate to the main page of this script's GitHub repository.
    * Find the script file `YouTubeHighSpeedSubtitleFix.user.js`.
    * Click on the script file to view its content.
    * Click the **"Raw"** button.
    * Your userscript manager should automatically detect the raw script and prompt you to install it.
    * Confirm the installation.

## User Settings

Look at the top of the script file to change these:

```javascript
// --- User Adjustable Settings ---
const HIGH_SPEED_THRESHOLD = 2.7; // Speed when script activates
const NUDGE_INTERVAL = 1000;    // How often to refresh (ms)
const DELAY_BETWEEN_API_TOGGLES = 0; // Delay between "off" & "on" (ms)
const DEBUG_LOGGING = false;      // Set to true for troubleshooting
const CAPTION_DIALOG_SELECTOR = ".caption-window.ytp-caption-window-top"; // CSS for hiding pop-up
// --- End User Adjustable Settings ---
