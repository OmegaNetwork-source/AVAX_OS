# Soneium Arcade – Games

These games are part of the **Soneium Arcade** monorepo and are configured for the **Soneium** network (Chain ID 1868).

| Game        | Folder        | Entry point           |
|------------|----------------|------------------------|
| Quake      | `Omega_Quake/` | `index.html`           |
| Arcade Bot | `arcadebots/`  | `dist/index.html` (run `npm run build` first) |
| Snake      | `somniasnake/` | `index.html`           |
| Space Game | `spacegame/`   | `index.html`           |

## Running locally

From the **Soniuem Arcade** repo root (parent of `games/`), serve the whole site so the hub and all games work from one origin:

```bash
# From repo root (Soniuem Arcade)
npx serve .
# or
python -m http.server 8080
```

Then open the hub at `http://localhost:3000` (serve) or `http://localhost:8080` and use “Play Now” to open each game.

### Arcade Bot (Vite)

Arcade Bot is a Vite/TypeScript app. From the repo root you can either:

- Build and serve: from repo root run `cd games/arcadebots; npm install; npm run build` (PowerShell: use `;` not `&&`). Then serve the repo root; the hub links to `games/arcadebots/dist/index.html`. Or
- Run dev server: `cd games/arcadebots; npm install; npm run dev` and open the URL Vite prints.

## Network

All games use **Soneium** (Chain ID `0x74c` / 1868). See `../SONEIUM_NETWORK_CONFIG.md` in the repo root for RPC and explorer URLs.
