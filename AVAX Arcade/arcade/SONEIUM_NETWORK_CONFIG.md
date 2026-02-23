# Soneium Network Configuration

Use this config when integrating the Soneium network in games and dApps (e.g. Omega Quake, Arcade Bots, Snake, Space Game).

## Network parameters

| Field | Value |
|-------|--------|
| **Network name** | Soneium |
| **Chain ID** | `1868` (hex: `0x74c`) |
| **Native currency** | ETH (18 decimals) |
| **Block gas limit** | 40000000 |

## RPC URLs

- `https://soneium.drpc.org`
- `https://rpc.sentio.xyz/soneium-mainnet`
- `https://rpc.soneium.org`
- `wss://soneium.drpc.org` (WebSocket)

## Block explorer URLs

- https://soneium.blockscout.com
- https://www.okx.com/web3/explorer/soneium
- https://soneium.slam.vision

## JavaScript (EIP-3326 / wallet_addEthereumChain)

```javascript
const SONEIUM = {
  chainId: '0x74c', // 1868
  chainName: 'Soneium',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: [
    'https://soneium.drpc.org',
    'https://rpc.sentio.xyz/soneium-mainnet',
    'https://rpc.soneium.org'
  ],
  blockExplorerUrls: [
    'https://soneium.blockscout.com',
    'https://www.okx.com/web3/explorer/soneium',
    'https://soneium.slam.vision'
  ]
};
```

## Game repos to update

Replace Somnia (Chain ID 5031) with Soneium (Chain ID 1868) in:

- **Omega_Quake**: https://github.com/OmegaNetwork-source/Omega_Quake — `src/wallet.js` or equivalent `NETWORK_CONFIGS`; add Soneium and/or switch default to Soneium.
- **arcadebots**: https://github.com/OmegaNetwork-source/arcadebots — network config in `src` (e.g. chainId, RPC, explorer).
- **somniasnake**: https://github.com/OmegaNetwork-source/somniasnake — any chainId / RPC / explorer references.
- **spacegame**: https://github.com/OmegaNetwork-source/spacegame — same; check `index.html` and any JS that sets chain or RPC.

Search for: `5031`, `somnia`, `Somnia`, `api.infra.mainnet.somnia.network`, `explorer.somnia.network` and replace with the Soneium values above.
