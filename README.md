# 🎵 Ohm - Web Music Player

A modern, aesthetic web music player featuring an interactive audio visualizer, dynamic waveforms, synchronized lyrics display, playlist management, and song upload capabilities.

---

## ✨ Features

- **Dynamic Audio Visualizer**: Ambient glow, flowing multi-layer audio waves, and real-time frequency equalizer bars powered by the Web Audio API.
- **Full Player Controls**: Play / Pause, Next, Previous, Shuffle mode, Repeat mode, and smooth seek / scrub controls.
- **Volume & Progress Bar**: Interactive timeline slider with elapsed and total duration counter.
- **Curated Playlist & Library**: Track list with active song highlighting, duration badges, and instant deletion/management.
- **Song Upload Modal**: Upload MP3/audio files, custom album artwork, lyrics excerpt, artist, album, and duration.
- **Dual Server Architecture**:
  - **Node.js Server (`server.js`)**: Zero-dependency HTTP server with HTTP 206 partial content streaming for fast, smooth audio seeking.
  - **PHP & MySQL Stack (`index.php`)**: Full PHP backend with automatic MySQL database schema generation and persistent song storage.
  - **Standalone Mode**: Can also run directly by opening `index.html` in any modern web browser.

---

## 🚀 Getting Started

### Option 1: Running with Node.js (Recommended)

1. Ensure [Node.js](https://nodejs.org/) is installed.
2. In the project root, start the server:
   ```bash
   node server.js
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

### Option 2: Running with PHP & MySQL

1. Ensure PHP and MySQL (e.g., XAMPP, WAMP, or standalone) are running.
2. The database configuration automatically connects to `music_player` on `localhost` (supports `root` password or empty password).
3. Start the PHP built-in development server:
   ```bash
   php -S 127.0.0.1:8000
   ```
4. Open your browser and navigate to:
   ```
   http://127.0.0.1:8000/index.php
   ```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| <kbd>Space</kbd> | Play / Pause |
| <kbd>←</kbd> | Seek Backward 5s |
| <kbd>→</kbd> | Seek Forward 5s |
| <kbd>↑</kbd> | Volume Up 5% |
| <kbd>↓</kbd> | Volume Down 5% |
| <kbd>M</kbd> | Mute / Unmute |
| <kbd>N</kbd> | Next Track |
| <kbd>P</kbd> | Previous Track |
| <kbd>S</kbd> | Toggle Shuffle |
| <kbd>R</kbd> | Toggle Repeat |

---

## 📁 Project Structure

```text
├── covers/                 # Album artwork images (JPG, PNG, SVG)
├── music/                  # Audio tracks (MP3)
├── app.js                  # Frontend player logic & Web Audio visualizer
├── config.php              # PHP MySQL database connection configuration
├── database.php            # Database helper functions & schema initialization
├── index.html              # Modern web player user interface
├── index.php               # PHP web player interface
├── main.php                # Alternative player template
├── package.json            # Node.js project configuration
├── README.md               # Documentation
├── script.js               # Original script logic
├── server.js               # Node.js HTTP server with audio streaming
├── songs.json              # Song database / playlist catalog
├── styles.css              # Styling, animations, and visualizer styling
└── upload.php              # PHP song upload handler
```

---

## 📄 License

MIT License. Open source and free to use.
