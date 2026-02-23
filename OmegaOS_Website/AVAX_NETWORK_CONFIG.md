# Avalanche Fuji Testnet (C-Chain) Configuration

Omega OS is configured to use **Avalanche Fuji Testnet** for licensing, identity, and document sync.

## Network Details

- **Network name:** Avalanche Fuji C-Chain
- **Chain ID:** `43113` (hex: `0xA86A`)
- **RPC URL:** `https://api.avax-test.network/ext/bc/C/rpc`
- **Block explorer:** https://testnet.snowtrace.io/
- **Currency symbol:** AVAX

## Environment Variables

Override defaults in `identity-manager.js` with:

```bash
# RPC and chain
export OMEGA_NETWORK_RPC=https://api.avax-test.network/ext/bc/C/rpc
export OMEGA_NETWORK_CHAIN_ID=43113

# Contract addresses (deploy on Fuji and set these)
export OMEGA_IDENTITY_CONTRACT=0x...
export OMEGA_LICENSING_CONTRACT=0x...
export OMEGA_SYNC_CONTRACT=0x...
```

## Adding Fuji to MetaMask

- **Network name:** Avalanche Fuji C-Chain
- **RPC URL:** `https://api.avax-test.network/ext/bc/C/rpc`
- **Chain ID:** `43113`
- **Currency symbol:** AVAX
- **Block explorer:** `https://testnet.snowtrace.io`

## Deploying Contracts on Fuji

1. Get testnet AVAX from the [Fuji faucet](https://faucet.avax.network/).
2. Use Remix or Hardhat connected to Fuji (chainId 43113, RPC above).
3. Deploy in this order: `OmegaIdentityRegistry.sol` → `OmegaDocumentSync.sol` → `OmegaLicensing.sol`.
4. For `OmegaLicensing`, constructor args: staking amount, purchase amount, staking period (seconds), treasury address. Amounts are in wei (e.g. 1000 * 10^18 for 1000 AVAX).
5. Set the deployed addresses in env or in `identity-manager.js`.

**Quick path:** See **REMIX_DEPLOY_INTEGRATION.md** for step-by-step Remix + Fuji deploy and where to paste the three contract addresses.
