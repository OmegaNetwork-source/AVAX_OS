# AVAX Arcade – Games

These games are part of **AVAX Arcade** and are configured for **Avalanche Fuji testnet** (Chain ID 43113).

| Game        | Folder        | Entry point           |
|------------|----------------|------------------------|
| Quake      | `Omega_Quake/` | `index.html`           |
| Arcade Bot | `arcadebots/`  | `dist/index.html` (run `npm run build` first) |
| Snake      | `somniasnake/` | `index.html`           |
| Space Game | `spacegame/`   | `index.html`           |

## Running locally

From the **AVAX Arcade** repo root (parent of `games/`), serve the whole site so the hub and all games work from one origin:

```bash
# From repo root (AVAX Arcade/arcade)
npx serve .
# or
python -m http.server 8080
```

Then open the hub at `http://localhost:3000` (serve) or `http://localhost:8080` and use “Play Now” to open each game.

### Arcade Bot (Vite)

Arcade Bot is a Vite/TypeScript app. From the repo root you can either:

- Build and serve: from repo root run `cd games/arcadebots; npm install; npm run build`. Then serve the repo root; the hub links to `games/arcadebots/dist/index.html`. Or
- Run dev server: `cd games/arcadebots; npm install; npm run dev` and open the URL Vite prints.

## Network

All games use **Avalanche Fuji C-Chain** (Chain ID `0xA86B` / 43113). See `../AVAX_FUJI_NETWORK_CONFIG.md` for RPC and explorer URLs. Deploy the shared leaderboard to Fuji and set the contract address per `../DEPLOY_LEADERBOARDS_FUJI.md`.
