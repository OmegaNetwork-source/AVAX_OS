# Blockchain Integrations (AVAX Testnet)

This document summarizes all blockchain integrations in Omega OS and confirms the switch to **Avalanche Fuji Testnet (C-Chain)**.

## Summary: What Uses the Chain

| Integration | Contract | Purpose | Uses native token |
|-------------|----------|---------|--------------------|
| **Licensing** | `OmegaLicensing.sol` | Stake AVAX for 30-day license or purchase lifetime license; staking fee | Yes (AVAX) |
| **Identity** | `OmegaIdentityRegistry.sol` | Register OS identity (Omega ID) on-chain | Gas only |
| **Document sync** | `OmegaDocumentSync.sol` | Sync document hashes from Omega Word/Sheets | Gas only |
| **Wave 1.5 airdrop** | `ClaimDistributor15.sol` (in `wave-1.5/`) | Optional airdrop claim flow | Yes (claim tokens) |

So the **main OS integrations** are:
1. **License + staking fee** – `OmegaLicensing.sol` (stake or purchase with native AVAX).
2. **Identity registration** – one-time registration per identity.
3. **Document sync** – optional on-chain sync when saving documents.

The in-app **wallet** and **browser** (EVM + Solana providers) are multi-chain and support AVAX Fuji among other networks; they do not define “the” chain for licensing/identity/sync.

## Network: Avalanche Fuji Testnet (C-Chain)

- **Chain ID:** `43113` (hex: `0xA86A`)
- **RPC URL:** `https://api.avax-test.network/ext/bc/C/rpc`
- **Block explorer:** https://testnet.snowtrace.io/
- **Native token:** AVAX (testnet)

Contract addresses are set via environment variables or defaults in `identity-manager.js`. Deploy the contracts on Fuji and set:

- `AVAX_RPC` or `OMEGA_NETWORK_RPC`
- `AVAX_CHAIN_ID` or `OMEGA_NETWORK_CHAIN_ID`
- `OMEGA_IDENTITY_CONTRACT`
- `OMEGA_LICENSING_CONTRACT`
- `OMEGA_SYNC_CONTRACT`

See `AVAX_NETWORK_CONFIG.md` for full config and deployment notes.
