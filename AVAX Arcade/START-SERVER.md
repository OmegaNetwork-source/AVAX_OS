# Run a local server (required to see the arcade)

Opening `avax-arcade.html` directly (file://) usually shows a **black screen** because browsers restrict WebGL on local files. Use one of these instead:

## Option 1: Node (one-time)

In a terminal, from this folder:

```bash
npx serve -l 3000
```

Then open: **http://localhost:3000/avax-arcade.html**

## Option 2: Python

If you have Python installed:

```bash
python -m http.server 3000
```

Then open: **http://localhost:3000/avax-arcade.html**

## Option 3: Cursor / VS Code

1. Install the **Live Server** extension.
2. Right‑click `avax-arcade.html` → **Open with Live Server**.

You should see the arcade cabinet and the gray back wall; the Quake trailer will appear on the wall if `quake trailer.mp4` is in this folder and the page is loaded over http (e.g. via the server above).

**Clicking PLAY or the cabinet screen** loads the AVAX Arcade games page from the `arcade/` folder (glossy red, Avalanche-themed). Serve from this folder so both the 3D cabinet and the games site work.
