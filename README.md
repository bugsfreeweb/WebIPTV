# Bugsfree Web IPTV Player

**Bugsfree Web IPTV Player** is a modern, privacy-friendly IPTV streaming web app. It allows users to play online and local IPTV streams and playlists with a beautiful, responsive UI, channel history, favorites, live analysis, and more—right in your browser.

---

## Features

- **Modern Responsive UI**: Works on desktop and mobile browsers.
- **Stream Any Supported Video**:
  - Supports `.m3u8` (HLS), `.mpd` (DASH), `.mp4`, and direct stream/video links.
  - Works with both local file uploads and remote URLs.
- **Playlist Support**:
  - Load and parse M3U playlists from file or URL.
  - Channel logos are displayed; fallback to a default logo if missing.
  - Channel/favorite highlight and quick switching.
  - Playlist name always visible above channels.
- **History**:
  - Automatically saves uploaded files/URLs in history.
  - Re-load or delete any history entry, or clear all history.
- **Favorites**:
  - Mark/unmark any channel as favorite.
  - Export favorites as an M3U playlist.
- **Channel Analysis**:
  - One-click live status check for all channels: shows online/offline/total, with a donut chart.
- **Theme Support**:
  - Light and dark mode toggle.
- **Local Time Bar**:
  - Always shows your current local time at the top left, even in fullscreen.
- **Notifications**:
  - All status and error messages appear as centered overlays on the player—not as popups or alerts.
- **URL Encryption**:
  - When a channel is loaded or changed, the address bar updates to `?channel=ENCRYPTED` (20-30 chars). Channel URLs are never exposed in the browser bar.
  - You can bookmark/share the encrypted link; it will auto-decrypt and play on load.
- **No Tracking, Analytics, or Ads**:
  - 100% privacy-friendly, no telemetry, no cookies, no requests except for your streams and playlist links.

---

## Usage

### 1. Local Use (Open Without a Server)

Just open `index.html` in your browser. All features work locally.  
No installation, no backend needed!

### 2. Load a Playlist

- **From File**: Use the "Upload Playlist" button and select an `.m3u`, `.json`, or `.txt` file.
- **From URL**: Paste a direct link to an `.m3u`, `.json`, `.txt`, or stream URL and click "Load".
- The player will parse the playlist, show all channels, and start playing the first stream.
- The playlist name (file name or URL) is always shown above the channel list.

### 3. Channel Controls

- Click any channel to start streaming instantly.
- The selected channel is highlighted.
- Click the heart icon to add/remove from favorites (also highlighted).

### 4. History & Favorites

- All loaded files/URLs are saved in history for quick reload.
- Delete individual history entries or all at once.
- Export your favorites as an `.m3u` playlist.

### 5. Analysis

- Go to the Analysis tab and click the check icon to test all channels for online/offline status.
- See a summary and donut chart; filter by total/online/offline.

### 6. Encrypted Channel URLs

- As soon as you play a channel, the address bar shows `?channel=ENCRYPTEDLINK`.
- You can bookmark or share this link; opening it will auto-load and play the channel (as long as the playlist/channel was previously loaded on that browser).

---

## Tech Stack

- **HTML5, CSS3** (Vanilla, no frameworks)
- **JavaScript (ES6+)**
- [hls.js](https://github.com/video-dev/hls.js) for HLS streams
- [dash.js](https://github.com/Dash-Industry-Forum/dash.js) for DASH streams
- [feather-icons](https://feathericons.com/) for UI icons

---

## Privacy & Security

- No data is sent anywhere except for the stream URLs you load.
- All history, favorites, and playlist data are stored locally in your browser (localStorage).
- Channel links in the address bar are encrypted and cannot be reverse-engineered without the original playlist.

---

## Development

1. Clone or download the repository.
2. Simply open `index.html` in your browser to run locally.
3. All assets are loaded via CDN for quick prototyping and testing.
4. For production/hosting, you may self-host or deploy to any static web hosting service (Netlify, GitHub Pages, Vercel, etc.).

---

## File Structure

```
index.html
app.js
styles.css
README.md
```

---

## License

MIT License

---

## Credits

Made with ❤️ by Bugsfree Studio.
