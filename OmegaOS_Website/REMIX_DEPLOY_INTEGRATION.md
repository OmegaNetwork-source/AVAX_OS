# Remix + Avalanche Fuji – Deploy & Integrate

Deploy the three OS contracts on **Avalanche Fuji** via Remix, then paste the addresses into the app.

## 1. Get Fuji AVAX

- Faucet: https://faucet.avax.network/
- Add **Avalanche Fuji C-Chain** to MetaMask:
  - Network name: **Avalanche Fuji C-Chain**
  - RPC URL: `https://api.avax-test.network/ext/bc/C/rpc`
  - Chain ID: `43113`
  - Symbol: **AVAX**
  - Explorer: `https://testnet.snowtrace.io`

## 2. Remix – Connect to Fuji

1. Open https://remix.ethereum.org
2. **Deploy & Run** → **Environment** → **Injected Provider - MetaMask**
3. In MetaMask, switch to **Avalanche Fuji C-Chain** (Chain ID 43113)

## 3. Deploy the Three Contracts

### A. OmegaIdentityRegistry

1. In Remix, create file `OmegaIdentityRegistry.sol` and paste from `contracts/OmegaIdentityRegistry.sol`
2. Compile (Compiler 0.8.20+)
3. Deploy & Run → select **OmegaIdentityRegistry** → **Deploy**
4. Copy the deployed contract address → **Identity contract**

### B. OmegaDocumentSync

1. Create `OmegaDocumentSync.sol` from `contracts/OmegaDocumentSync.sol`
2. Compile → Deploy **OmegaDocumentSync**
3. Copy address → **Document Sync contract**

### C. OmegaLicensing

1. Create `OmegaLicensing.sol` from `contracts/OmegaLicensing.sol`
2. Compile → select **OmegaLicensing**
3. Constructor args (all in wei; for testnet you can use small amounts):
   - `_stakingAmount`: e.g. `100000000000000000` (0.1 AVAX) or `1000000000000000000` (1 AVAX)
   - `_purchaseAmount`: e.g. `1000000000000000000` (1 AVAX) or `10000000000000000000` (10 AVAX)
   - `_stakingPeriod`: `2592000` (30 days in seconds)
   - `_treasury`: your wallet address (or `0x0000000000000000000000000000000000000000` to use deployer as treasury)
4. Deploy → copy address → **Licensing contract**

## 4. Paste Addresses into the App

Open **`identity-manager.js`** and set the three addresses at the top (lines ~19–21):

```javascript
// Paste your Remix-deployed contract addresses (Avalanche Fuji) below:
this.identityContractAddress = process.env.OMEGA_IDENTITY_CONTRACT || '0xYourIdentityContractAddress';
this.licensingContractAddress = process.env.OMEGA_LICENSING_CONTRACT || '0xYourLicensingContractAddress';
this.syncContractAddress = process.env.OMEGA_SYNC_CONTRACT || '0xYourDocumentSyncContractAddress';
```

Replace `0xYourIdentityContractAddress` etc. with the addresses you copied from Remix.

Or use environment variables (same names) so you don’t edit the file.

## 5. ABIs (if missing)

If the app can’t load the ABIs, export them from Remix after compile:

- **Solidity Compiler** → **Compilation Details** → copy **ABI** for each contract
- Save as:
  - `contracts/IdentityRegistry.abi.json`
  - `contracts/DocumentSync.abi.json`
  - `contracts/Licensing.abi.json`

## 6. Verify

- Restart the app (or reload if web).
- Wallet should be on **AVAX Fuji**; Identity app should register and Licensing should show stake/purchase (using native AVAX on Fuji).

Explorer: https://testnet.snowtrace.io/
