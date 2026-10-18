# Let It Happen — SOL gift site (offline-ready)

## Run it
1. Extract the ZIP, preserving the folder structure.
2. Open `let_it_happen_final` in VS Code.
3. Run `index.html` with Live Server (recommended).
4. The layout and supplied artwork are local; no internet connection or YouTube is required.

## Default music
The player expects a legally obtained audio file named `let-it-happen.mp3` at:
`let_it_happen_final/assets/let-it-happen.mp3`

The song itself is not included because it is copyrighted. Copy your audio file into `assets` and name it exactly `let-it-happen.mp3`. Then reload the site. If the file is not present, the player shows a clear message instead of silently trying YouTube. You can still click **ADD YOUR MUSIC** to choose audio from the device.

## Player behavior
- Play/pause, stop, previous/next, seek, and volume work with local audio.
- Add multiple local audio files; tracks appear in the queue.
- The birthday surprise appears five seconds after audio playback actually starts.
- No YouTube or Google Fonts dependency.

## Files
- `index.html`: page structure
- `styles.css`: responsive styling and turntable animations
- `script.js`: local audio player, queue, surprise timer
- `assets/currents-messi.png`: supplied artwork
