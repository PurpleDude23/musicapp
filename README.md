# Pulse — Music Studio

A browser-based music-making app with a **synth keyboard**, **drum pads**, and **step sequencer**. Built with [Tone.js](https://tonejs.github.io/).

## Features

- **Synth** — Play notes with mouse or computer keys (two octaves). Adjust attack and release.
- **Drums** — Kick, snare, hi-hat, clap, tom, open hat. Click pads to play.
- **Step sequencer** — Draw patterns for kick, snare, hi-hat, and clap. Set BPM and press Play.

## How to run

1. Open the folder in a terminal.
2. Serve the app with a local server (required for Tone.js to load):

   **Python 3:**
   ```bash
   python -m http.server 8080
   ```

   **Node (npx):**
   ```bash
   npx serve -l 8080
   ```

3. In your browser go to: **http://localhost:8080**

> Browsers require a user gesture (e.g. click Play) before audio can start.

## Keyboard shortcuts (synth)

- **A**–**;** — White and black keys from C4 to E5 (same row as piano: A=C, S=D, … W=C#, E=D#, …).

## Tech

- Vanilla HTML/CSS/JS
- Tone.js 14 (CDN) for synthesis and sequencing
