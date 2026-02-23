# Deploy the Single Arcade Leaderboard to Soneium

All four games (Quake, Arcade Bot, Space Game, Snake) use **one** leaderboard contract: `contracts/SoneiumArcadeLeaderboard.sol`. Each game uses a **game ID** (0–3) so scores are stored per game in the same contract.

## Game IDs

| Game ID | Game        |
|--------:|-------------|
| 0       | Quake       |
| 1       | Arcade Bot  |
| 2       | Space Game  |
| 3       | Snake       |

## Deploy once

1. **Get Soneium ETH** in your wallet (for gas).
2. **Open the contract**  
   Use `contracts/SoneiumArcadeLeaderboard.sol` in Remix, or your Hardhat/Foundry project.
3. **Compile**  
   Solidity 0.8.20+.
4. **Deploy to Soneium**  
   - **Remix:** Connect MetaMask to Soneium (Chain ID 1868), then Deploy.  
   - **Foundry:**  
     `forge create contracts/SoneiumArcadeLeaderboard.sol:SoneiumArcadeLeaderboard --rpc-url https://rpc.soneium.org --private-key <KEY>`  
   - **Hardhat:** Point your config to Soneium RPC and run your deploy script.
5. **Copy the deployed contract address.**

## Set the address everywhere

After deployment, set that **same** address in these places (replace `0x0000...` with your deployed address):

| Where | What to set |
|-------|-------------|
| **Quake** | `games/Omega_Quake/src/wallet.js` → `soneium.contractAddress` |
| **Arcade Bot** | `games/arcadebots/src/wallet/ContractManager.ts` → `DEFAULT_CONTRACT_ADDRESS` |
| **Space Game** | `games/spacegame/index.html` → `CONTRACT_ADDRESS` |
| **Snake** | `games/somniasnake/index.html` → `LEADERBOARD_CONFIG.address` |

Optional: if the hub shows SONI or uses a shared config, set the same address there if applicable.

## RPC & explorer

- **Chain ID:** 1868 (0x74c)  
- **RPC:** `https://soneium.drpc.org`, `https://rpc.sentio.xyz/soneium-mainnet`, `https://rpc.soneium.org`  
- **Explorer:** https://soneium.blockscout.com  

See `SONEIUM_NETWORK_CONFIG.md` for full network details.
