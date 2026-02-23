# Deploying on Avalanche (AVAX) with Dapp.Fun

This guide walks you through compiling and deploying a smart contract on **Avalanche C-Chain** (mainnet) or **Avalanche Fuji Testnet** using the Dapp.Fun IDE and API.

---

## Network reference

| Network | Use case | Chain ID (EVM) | Explorer |
|--------|----------|----------------|----------|
| **Avalanche C-Chain** | Production (tokens, dApps) | 43114 | [snowtrace.io](https://snowtrace.io) |
| **Avalanche Fuji Testnet** | Testing (free test AVAX) | 43113 | [testnet.snowtrace.io](https://testnet.snowtrace.io) |

- **Mainnet RPC:** `https://api.avax.network/ext/bc/C/rpc`  
- **Fuji RPC:** `https://api.avax-test.network/ext/bc/C/rpc`  
- **Fuji faucet:** [faucet.avax.network](https://faucet.avax.network/) or [ChainList 43113](https://chainlist.org/chain/43113)

---

## Deploy from the IDE

### 1. Open the IDE

From the main page, click **Open IDE**.

### 2. Open or create a contract

Use an existing Solidity file (e.g. `Contract.sol`) or create one. Example ERC-20:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, Ownable {
    constructor() ERC20("My Token", "MTK") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
```

### 3. Compile

Click **Compile** and wait for the green checkmark (`✓ Compiled`).

### 4. Choose network

In the top bar, open the network dropdown:

- **Avalanche C-Chain** — for mainnet launches.
- **Avalanche Fuji Testnet** — for testing (get test AVAX from the faucet first).

### 5. Connect wallet

Click **Connect** and approve adding/switching to Avalanche (or Fuji) in MetaMask.

### 6. Deploy

Click **Deploy**, confirm the transaction in MetaMask, and wait for the success message and contract address in the console.

You can open the transaction and contract on [Snowtrace](https://snowtrace.io) (or testnet.snowtrace.io for Fuji).

---

## Deploy via API (AVAX)

Use the same networks with the REST API for scripts or CI.

**Mainnet:**
```json
POST /deploy
{
  "chainId": "avax-mainnet",
  "privateKey": "0x...",
  "contractName": "MyToken",
  "constructorArgs": ["My Token", "MTK", "1000000000000000000000000"],
  "sources": { "MyToken.sol": { "content": "..." } }
}
```

**Fuji Testnet:**
```json
POST /deploy
{
  "chainId": "avax-fuji",
  "privateKey": "0x...",
  ...
}
```

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for full parameters, examples, and Avalanche L1 subnet `chainId` values.

---

## Summary

- **Mainnet:** Avalanche C-Chain (43114), RPC `api.avax.network`, explorer Snowtrace.  
- **Testnet:** Fuji (43113), RPC `api.avax-test.network`, test AVAX from faucet.  
- IDE and API both support **avax-mainnet** and **avax-fuji**; the API also supports Avalanche L1 subnets (see API docs).
