# Network Updates

## AVAX as Primary Networks (Current)

The app now uses **Avalanche C-Chain Mainnet** as the default network, followed by **Avalanche Fuji Testnet** and Avalanche L1 subnets.

### Default order
1. **Avalanche C-Chain** (Chain ID: 43114) – main default  
   - RPC: `https://api.avax.network/ext/bc/C/rpc`  
   - Explorer: [snowtrace.io](https://snowtrace.io)

2. **Avalanche Fuji Testnet** (Chain ID: 43113)  
   - RPC: `https://api.avax-test.network/ext/bc/C/rpc`  
   - Explorer: [testnet.snowtrace.io](https://testnet.snowtrace.io)  
   - Fuji details: [ChainList 43113](https://chainlist.org/chain/43113)

3. **Avalanche L1s** (subnets) – DFK, Dexalot, Beam, Blitz, Artery, Blaze, AIBTRUST, Andromeda, Blockticity, CX Chain, Cloudverse, DOS, Deboard.

4. Solana, Omega, Somnia, Monad, Ethereum, and other chains follow.

### AVAX L1s included
| Name            | EVM Chain ID | RPC pattern |
|-----------------|-------------|-------------|
| DFK L1          | 53935       | subnets.avax.network/defi-kingdoms/dfk-chain/rpc |
| Dexalot L1      | 432204      | subnets.avax.network/dexalot/mainnet/rpc |
| Beam L1         | 4337        | subnets.avax.network/beam/mainnet/rpc |
| Blitz L1        | 1344        | subnets.avax.network/blitz/mainnet/rpc |
| Artery          | 4313        | subnets.avax.network/artery/mainnet/rpc |
| Blaze           | 46975       | subnets.avax.network/blaze/mainnet/rpc |
| AIBTRUST Mainnet| 80000       | subnets.avax.network/aibtrust/mainnet/rpc |
| Andromeda       | 241121      | subnets.avax.network/andromeda/mainnet/rpc |
| Blockticity     | 28530       | subnets.avax.network/blockticity/mainnet/rpc |
| CX Chain        | 737373      | subnets.avax.network/cx/mainnet/rpc |
| Cloudverse L1   | 33210       | subnets.avax.network/cloudverse/mainnet/rpc |
| DOS L1          | 7979        | subnets.avax.network/dos/mainnet/rpc |
| Deboard L1      | 29732       | subnets.avax.network/deboard/mainnet/rpc |

Some L1 RPC paths may need to be adjusted per [Avalanche docs](https://docs.avax.network/tooling/rpc-providers); DFK, Dexalot, and Beam use known public RPCs.

---

# Previously: Somnia & Monad Network Support

We have expanded the network support to include **Somnia** and **Monad**, alongside the existing Omega Network.

## New Networks

### 1. Somnia Network
- **Chain ID**: `5031` (0x13a7)
- **RPC**: `https://api.infra.mainnet.somnia.network/`
- **Explorer**: `https://explorer.somnia.network`
- **Currency**: `SOMI`

### 2. Monad Mainnet
- **Chain ID**: `143` (0x8f)
- **RPC**: `https://rpc.monad.xyz`
- **Explorer**: `https://monadscan.com`
- **Currency**: `MON`

## Improved Connection Logic
The `connect()` function has been upgraded to be **dynamic**:
- It respects the network currently selected in the DApp Forge UI.
- If you select **Somnia** in the dropdown and click Connect, it will switch/add Somnia.
- If you select **Monad**, it will switch/add Monad.
- If no specific network is selected (or generic Ethereum), it defaults to **Omega Network**.

## How to Switch Networks
1.  In the DApp Forge UI (top right), click on the network dropdown (e.g., where it shows the current chain icon).
2.  Select **Somnia** or **Monad**.
3.  If you are not connected, click **Connect**.
4.  MetaMask will prompt to switch to the chosen network.
