# YouTube Subtitle Sync Refresher

This script was created to fix an annoying issue where YouTube subtitles can lag, skip lines, or go out of sync when you watch videos at fast playback speeds (like 2x, 3x, etc.). If your subtitles can't keep up when you speed things up, this script aims to help!

## How It Works

When you're watching a YouTube video faster than a certain value (2.7x by default, but you can change it):
1. The script finds YouTube's main video player.
2. Every few seconds (you can also set how often), it quickly turns the captions off and then almost instantly on again.
3. This quick off/on cycle tricks YouTube's caption system into re-syncing with the video's current time.
4. The goal is to make this refresh so fast you barely notice it, keeping your subtitles smooth.
5. It also tries to hide the little pop-up message (like "English (auto-generated)") that sometimes appears when captions are toggled this way.

## Features

* You decide the speed when it starts working.
* You decide how often it refreshes the subtitles.
* The "off" time during the refresh is super short to be almost invisible.
* It tries to hide YouTube's own pop-up message about caption changes.
* You can turn on debug messages in the console if you need to see what it's doing.

## How to Install

1.  **Get a Userscript Manager:** First, you need a browser extension that handles userscripts. Good ones are:
* [Tampermonkey](https://www.tampermonkey.net/) (for Chrome, Firefox, Edge, Safari, Opera)
2.  **Install This Script:**
* If you got this script from GitHub (or a site like Greasy Fork), look for a "Raw" button or an "Install" button. Your userscript manager should see it and ask if you want to install.
* Or, you can create a new script in your userscript manager and just paste all the script code into it.

## User Settings

Look at the top of the script file. You'll see a section with settings you can easily change:

```javascript
// --- User Adjustable Settings ---
const HIGH_SPEED_THRESHOLD = 2.7; // Speed when script activates (e.g., 2.7 means 2.7x or faster).
const NUDGE_INTERVAL = 1000;    // How often to refresh (ms). Default: 1000ms = 1 second.
const DELAY_BETWEEN_API_TOGGLES = 0; // Delay between "off" & "on" (ms). Default: 0 (as fast as possible).
const DEBUG_LOGGING = false;    // Set to true for troubleshooting messages in the console (F12).
const CAPTION_DIALOG_SELECTOR = ".caption-window.ytp-caption-window-top"; // CSS for hiding YouTube's caption change pop-up.
// --- End User Adjustable Settings ---
```

* HIGH_SPEED_THRESHOLD: The playback speed when the script should start working.
* NUDGE_INTERVAL: How often (in milliseconds) the script attempts the subtitle refresh.
* DELAY_BETWEEN_API_TOGGLES: The tiny duration subtitles are "off" during a refresh. 0 is the quickest.
* DEBUG_LOGGING: Change to true to see detailed script activity in your browser's developer console (F12). Good for troubleshooting, then set to false.
* CAPTION_DIALOG_SELECTOR: This is important for hiding the "English (auto-generated)" pop-up.
* **Heads Up!** YouTube might change its website code, causing this selector to stop working. The current value (`.caption-window.ytp-caption-window-top`) is based on past observations.
* **If the pop-up reappears:** You'll need to find its new CSS selector. To do this: when the pop-up briefly appears, quickly right-click on it and choose "Inspect Element." Look at the highlighted HTML for its class or id. Update the CAPTION_DIALOG_SELECTOR value in the script with the new selector (e.g., if class is `some-new-popup`, use `.some-new-popup`).

## Important Notes & Troubleshooting

* **YouTube Updates:** The main challenge with scripts like this is that YouTube changes its site often. An update can break how the script finds the player or hides the pop-up. If it stops working, it might need adjustments.
* **Finding the Player:** The script does its best to find YouTube's player controls, but this isn't an official method and could fail if YouTube makes big changes.
* **Hiding the Pop-up (Again):** If the CAPTION_DIALOG_SELECTOR is wrong or YouTube changes its pop-up structure, the pop-up might not be hidden, or (rarely) other things might get hidden if the selector accidentally becomes too broad. Double-check it if you have issues.
* **Performance:** The script is designed to be very light. With default settings, you shouldn't notice any performance hit on a modern computer.
* **Debug Mode:** If things aren't working, the first step is to set DEBUG_LOGGING = true; and check your browser's console (F12) for messages from the script. This often shows where the problem might be (e.g., "Player instance not found").
