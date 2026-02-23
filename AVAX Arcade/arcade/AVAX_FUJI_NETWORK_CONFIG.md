# Avalanche Fuji Testnet Configuration

Use this config for all AVAX Arcade games. Fuji is the official Avalanche testnet for development and testing.

## Network parameters

| Field | Value |
|-------|--------|
| **Network name** | Avalanche Fuji C-Chain |
| **Chain ID** | `43113` (hex: `0xA86B`) |
| **Native currency** | AVAX (18 decimals) |
| **Block explorer** | Snowtrace Testnet |

## RPC URLs

- `https://api.avax-test.network/ext/bc/C/rpc`
- `https://rpc.ankr.com/avalanche_fuji`
- `https://avalanche-fuji-c-chain-rpc.publicnode.com`

## Block explorer

- https://testnet.snowtrace.io

## JavaScript (EIP-3326 / wallet_addEthereumChain)

```javascript
const AVAX_FUJI = {
  chainId: '0xA86B', // 43113
  chainName: 'Avalanche Fuji C-Chain',
  nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
  rpcUrls: [
    'https://api.avax-test.network/ext/bc/C/rpc',
    'https://rpc.ankr.com/avalanche_fuji',
    'https://avalanche-fuji-c-chain-rpc.publicnode.com'
  ],
  blockExplorerUrls: ['https://testnet.snowtrace.io']
};
```

## Games updated for Fuji

- **Omega_Quake** – `games/Omega_Quake/src/wallet.js` (fuji config, default network)
- **Arcade Bot** – `games/arcadebots/src/wallet/WalletManager.ts` (AVAX_FUJI_NETWORK)
- **Snake** – `games/somniasnake/index.html` (LEADERBOARD_CONFIG)
- **Space Game** – `games/spacegame/index.html` (FUJI_PARAMS)

## Leaderboard contract

Deploy `contracts/SoneiumArcadeLeaderboard.sol` (or an Avalanche-compatible copy) to Fuji, then set the same contract address in each game. See `DEPLOY_LEADERBOARDS_FUJI.md`.
