// ==UserScript==
// @name         YouTube High Speed Subtitle Fix
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Keeps YouTube subtitles synced at high playback speeds by briefly toggling them via player API, aiming for an imperceptible refresh.
// @author       AI Assistant & User Collaboration
// @match        *://www.youtube.com/watch*
// @match        *://www.youtube.com/embed/*
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // --- User Adjustable Settings ---
    // Speed at which the subtitle refresh mechanism activates.
    const HIGH_SPEED_THRESHOLD = 2.7; // e.g., 2.7 for 2.7x speed or higher.

    // How often the script will attempt a refresh cycle (in milliseconds).
    const NUDGE_INTERVAL = 1000;    // Currently 1 second.

    // The very short delay (in milliseconds) between programmatically turning subtitles "off" and then "on" again
    // during a refresh cycle. Setting to 0 queues the "on" action for the next event loop tick (fastest possible).
    const DELAY_BETWEEN_API_TOGGLES = 0; // 0ms for the quickest possible internal toggle.

    // Set to true to see detailed logs in the browser's developer console (F12).
    // Recommended to set to false for normal use once confirmed working.
    const DEBUG_LOGGING = false;

    // CSS Selector for the caption track change dialog/toast that briefly appears (e.g., "English (auto-generated)").
    // This script attempts to hide it. You may need to update this selector if YouTube changes its UI.
    const CAPTION_DIALOG_SELECTOR = ".caption-window.ytp-caption-window-top";
    // --- End User Adjustable Settings ---

    const SCRIPT_PREFIX = "[YT HighSpeedSubFix v1.0.0]";
    let videoElement = null;
    let ytPlayer = null; // Cached reference to YouTube's player object
    let nudgeIntervalId = null;
    let isNudging = false; // Flag to prevent overlapping nudge attempts
    let currentCaptionTrackToRestore = null; // Stores the state of captions before the "off" toggle

    function log(message) {
        if (DEBUG_LOGGING) {
            console.log(`${SCRIPT_PREFIX} ${message}`);
        }
    }

    // Injects CSS to hide the caption track change notification dialog.
    function addCustomCssToHideDialog() {
        if (CAPTION_DIALOG_SELECTOR) {
            const css = `
                ${CAPTION_DIALOG_SELECTOR} {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    width: 0 !important;
                    height: 0 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    border: none !important;
                }
            `;
            try {
                GM_addStyle(css); // Tampermonkey's way to add CSS
                log(`Injected CSS to hide dialog with selector: ${CAPTION_DIALOG_SELECTOR}`);
            } catch (e) {
                log(`GM_addStyle failed (error: ${e}). Using fallback <style> tag injection.`);
                const styleSheet = document.createElement("style");
                styleSheet.id = "yt-highspeedsubfix-style"; // Unique ID for the style tag
                styleSheet.type = "text/css";
                styleSheet.innerText = css;
                document.head.appendChild(styleSheet);
            }
        } else {
            log("CAPTION_DIALOG_SELECTOR is not defined; skipping CSS injection for dialog.");
        }
    }

    // Attempts to get a reference to YouTube's internal player object.
    function getYouTubePlayerInstance() {
        if (ytPlayer && typeof ytPlayer.getOption === 'function' && typeof ytPlayer.setOption === 'function') {
            return ytPlayer; // Return cached if still seems valid
        }

        let foundPlayer = null;
        if (videoElement) {
            const moviePlayerElement = document.getElementById('movie_player');
            if (moviePlayerElement && typeof moviePlayerElement.setOption === 'function' && typeof moviePlayerElement.getOptions === 'function') {
                log("Found player instance via #movie_player element.");
                foundPlayer = moviePlayerElement;
            } else {
                for (const key in videoElement) {
                    if (key.startsWith('__yt') || key.startsWith('yt$') || key.startsWith('ytplayer$')) {
                        if (videoElement[key] && typeof videoElement[key].setOption === 'function' && typeof videoElement[key].getOptions === 'function') {
                            log(`Found potential player instance on videoElement via key: ${key}`);
                            foundPlayer = videoElement[key];
                            break;
                        }
                    }
                }
            }
        }

        if (!foundPlayer && window.yt && window.yt.player && typeof window.yt.player.getPlayerByElement === 'function') {
            const playerInstance = window.yt.player.getPlayerByElement(document.getElementById('movie_player') || videoElement);
            if (playerInstance && typeof playerInstance.setOption === 'function') {
                log("Found player instance via window.yt.player.getPlayerByElement.");
                foundPlayer = playerInstance;
            }
        }

        if (!foundPlayer && typeof window.ytplayer === 'object' && window.ytplayer !== null && typeof window.ytplayer.setOption === 'function') {
            log("Found player instance via global window.ytplayer.");
            foundPlayer = window.ytplayer;
        }

        if (foundPlayer) {
            ytPlayer = foundPlayer;
            return ytPlayer;
        }

        log("YouTube player instance NOT found for this cycle.");
        return null;
    }

    // Core logic to toggle captions off and then on again using the player API.
    function attemptApiCaptionToggle() {
        if (!ytPlayer) {
            log("Cannot attempt API toggle: YouTube player instance is not available.");
            isNudging = false;
            return;
        }
        if (typeof ytPlayer.setOption !== 'function' || typeof ytPlayer.getOption !== 'function') {
            log("Player instance seems invalid (missing setOption/getOption methods). Clearing cache.");
            ytPlayer = null; // Clear cached player
            isNudging = false;
            return;
        }

        try {
            let initialTrackInfo = ytPlayer.getOption('captions', 'track');
            if (initialTrackInfo && Object.keys(initialTrackInfo).length > 0 && (initialTrackInfo.languageCode || initialTrackInfo.translationLanguageCode || initialTrackInfo.sourceLanguageCode)) {
                currentCaptionTrackToRestore = JSON.parse(JSON.stringify(initialTrackInfo));
            } else {
                currentCaptionTrackToRestore = null;
            }

            ytPlayer.setOption('captions', 'track', {});

            setTimeout(() => {
                if (videoElement && !videoElement.paused && videoElement.playbackRate >= HIGH_SPEED_THRESHOLD && ytPlayer && typeof ytPlayer.setOption === 'function') {
                    if (currentCaptionTrackToRestore) {
                        ytPlayer.setOption('captions', 'track', currentCaptionTrackToRestore);
                    } else {
                        ytPlayer.setOption('captions', 'track', {});
                    }
                }
                isNudging = false;
            }, DELAY_BETWEEN_API_TOGGLES);

        } catch (e) {
            log(`Error during API toggle: ${e}`);
            isNudging = false;
        }
    }

    // This function is called by the interval timer.
    function initiateNudgeCycleIfConditionsMet() {
        if (isNudging || !videoElement || document.hidden || videoElement.paused) {
            return;
        }
        if (videoElement.playbackRate < HIGH_SPEED_THRESHOLD) {
            return;
        }
        if (!ytPlayer || typeof ytPlayer.setOption !== 'function') {
            ytPlayer = getYouTubePlayerInstance();
            if (!ytPlayer) {
                log("Player instance not found for nudge cycle. Will retry next interval.");
                return;
            }
        }
        isNudging = true;
        log(`High speed (${videoElement.playbackRate.toFixed(2)}x). Initiating API caption toggle cycle.`);
        attemptApiCaptionToggle();
    }

    // Finds the main video element and sets up the script.
    function initializeScript() {
        videoElement = document.querySelector('video.html5-main-video');
        if (videoElement) {
            log("Video element found.");
            addCustomCssToHideDialog();
            ytPlayer = getYouTubePlayerInstance();
            if(ytPlayer) log("YouTube Player instance initially acquired.");
            else log("YouTube Player instance initially NOT acquired. Will attempt to acquire later.");

            if (nudgeIntervalId === null) {
                nudgeIntervalId = setInterval(initiateNudgeCycleIfConditionsMet, NUDGE_INTERVAL);
                log(`Nudge interval started (cycle attempts every ${NUDGE_INTERVAL / 1000}s, internal off/on delay ${DELAY_BETWEEN_API_TOGGLES}ms).`);
            }
        } else {
            log("Video element not found. Retrying in 2s...");
            setTimeout(initializeScript, 2000);
        }
    }

    // Script Entry Point
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(initializeScript, 3000);
    } else {
        window.addEventListener('load', () => setTimeout(initializeScript, 3000));
    }

    // Cleanup
    window.addEventListener('beforeunload', () => {
        if (nudgeIntervalId !== null) {
            clearInterval(nudgeIntervalId);
            nudgeIntervalId = null;
            log("Nudge interval cleared due to page unload.");
        }
        const styleElement = document.getElementById("yt-highspeedsubfix-style"); // Use specific ID for removal
        if (styleElement) {
            styleElement.remove();
            log("Removed injected CSS style.");
        }
    });
})();
