# Deploy the Arcade Leaderboard to Avalanche Fuji

All four games (Quake, Arcade Bot, Space Game, Snake) use **one** leaderboard contract. Each game uses a **game ID** (0–3) so scores are stored per game in the same contract.

## Game IDs

| Game ID | Game        |
|--------:|-------------|
| 0       | Quake       |
| 1       | Arcade Bot  |
| 2       | Space Game  |
| 3       | Snake       |

## Deploy once on Fuji

1. **Get Fuji AVAX** (testnet) from a [Fuji faucet](https://faucet.avax.network/).
2. **Use the contract**  
   `contracts/SoneiumArcadeLeaderboard.sol` is EVM-compatible; use it in Remix, Hardhat, or Foundry.
3. **Compile**  
   Solidity 0.8.20+.
4. **Deploy to Fuji**  
   - **Remix:** Connect MetaMask to Avalanche Fuji (Chain ID 43113), then Deploy.  
   - **Foundry:**  
     `forge create contracts/SoneiumArcadeLeaderboard.sol:SoneiumArcadeLeaderboard --rpc-url https://api.avax-test.network/ext/bc/C/rpc --private-key <KEY>`  
   - **Hardhat:** Point config to Fuji RPC and run your deploy script.
5. **Copy the deployed contract address.**

## Set the address everywhere

After deployment, set that **same** address in:

| Where | What to set |
|-------|-------------|
| **Quake** | `games/Omega_Quake/src/wallet.js` → `fuji.contractAddress` |
| **Arcade Bot** | `games/arcadebots/src/wallet/ContractManager.ts` → `DEFAULT_CONTRACT_ADDRESS` (or env/localStorage) |
| **Space Game** | `games/spacegame/index.html` → `CONTRACT_ADDRESS` |
| **Snake** | `games/somniasnake/index.html` → `LEADERBOARD_CONFIG.address` |

## Fuji RPC & explorer

- **Chain ID:** 43113 (0xA86B)  
- **RPC:** `https://api.avax-test.network/ext/bc/C/rpc`, `https://rpc.ankr.com/avalanche_fuji`  
- **Explorer:** https://testnet.snowtrace.io  

See `AVAX_FUJI_NETWORK_CONFIG.md` for full network details.
