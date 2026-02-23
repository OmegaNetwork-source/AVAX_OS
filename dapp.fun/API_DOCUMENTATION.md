# Dapp.Fun API — Avalanche (AVAX) Documentation

The Dapp.Fun API is built for **Avalanche** launches: compile and deploy smart contracts to **Avalanche C-Chain**, **Fuji Testnet**, and Avalanche L1 subnets. It supports AI agents, bots, and headless deployment.

## Base URL

- **Production:** `https://dapp-fun-api.onrender.com`
- **Local:** `http://localhost:3001` (when running the server)

---

## Supported Networks — AVAX

The API is configured for Avalanche first. You can deploy to any EVM chain by passing `chainId` (and optionally `rpcUrl` for custom RPCs).

### Avalanche C-Chain (mainnet & testnet)

| chainId         | Network               | EVM Chain ID | Currency | RPC | Explorer |
|-----------------|-----------------------|--------------|----------|-----|----------|
| `avax-mainnet`  | Avalanche C-Chain     | 43114        | AVAX     | `https://api.avax.network/ext/bc/C/rpc` | [Snowtrace](https://snowtrace.io) |
| `avax-fuji`     | Avalanche Fuji Testnet| 43113        | AVAX     | `https://api.avax-test.network/ext/bc/C/rpc` | [Snowtrace Fuji](https://testnet.snowtrace.io) |

**Mainnet (avax-mainnet)** — Production. Use for real tokens and dApps.  
**Fuji (avax-fuji)** — Testnet. Use for testing; get test AVAX from [Fuji faucet](https://faucet.avax.network/) / [ChainList 43113](https://chainlist.org/chain/43113).

### Avalanche L1 subnets

These `chainId` values are also supported for subnet deployments:

| chainId          | Network        | EVM Chain ID |
|------------------|----------------|---------------|
| `avax-dfk`       | DFK L1         | 53935         |
| `avax-dexalot`   | Dexalot L1     | 432204        |
| `avax-beam`      | Beam L1        | 4337          |
| `avax-blitz`     | Blitz L1       | 1344          |
| `avax-artery`    | Artery         | 4313          |
| `avax-blaze`     | Blaze          | 46975         |
| `avax-aibtrust`  | AIBTRUST Mainnet | 80000       |
| `avax-andromeda` | Andromeda      | 241121        |
| `avax-blockticity` | Blockticity  | 28530         |
| `avax-cx`        | CX Chain       | 737373        |
| `avax-cloudverse` | Cloudverse L1 | 33210       |
| `avax-dos`       | DOS L1         | 7979          |
| `avax-deboard`   | Deboard L1     | 29732         |

RPCs for these use the pattern `https://subnets.avax.network/...` (see [network_updates.md](./network_updates.md) for full URLs). You can override with `rpcUrl` in the request body.

### Other networks

`omega-mainnet`, `omega-testnet`, `solana`, `base`, `ethereum`, `monad`, `somnia` are also supported. For custom EVM chains, pass `chainId` (any string) and `rpcUrl`.

---

## Endpoints

### 1. Compile Solidity

Compiles Solidity and returns ABI and bytecode (no deployment).

**POST** `/compile`

**Body:**
```json
{
  "sources": {
    "MyContract.sol": {
      "content": "contract MyContract { ... }"
    }
  }
}
```

---

### 2. Deploy smart contract

Compiles (if needed) and deploys to the given network.

**POST** `/deploy`

**Body parameters**

| Parameter          | Type   | Required | Description |
|--------------------|--------|----------|-------------|
| `chainId`         | string | Yes      | e.g. `avax-mainnet`, `avax-fuji`, or any supported chainId. |
| `privateKey`       | string | Yes*     | Deployer wallet private key. *Can use server default if set. |
| `sources`          | object | Yes**    | Filename → `{ "content": "..." }` Solidity sources. **Omit if sending `artifact`. |
| `artifact`         | object | No       | Pre-compiled artifact (bytecode + ABI). Use when not sending `sources`. |
| `contractName`     | string | No       | Contract to deploy when multiple in sources. Recommended. |
| `constructorArgs`  | array  | No       | Constructor arguments in order. |
| `rpcUrl`           | string | No       | Override RPC for this request (e.g. custom Avalanche RPC). |

---

## Network reference (mainnet & testnet)

Use this when wiring wallets, frontends, or scripts.

**Avalanche C-Chain Mainnet**

- **chainId (API):** `avax-mainnet`
- **EVM Chain ID:** 43114 (0xa86a)
- **RPC:** `https://api.avax.network/ext/bc/C/rpc`
- **Explorer:** https://snowtrace.io
- **Native token:** AVAX (18 decimals)

**Avalanche Fuji Testnet**

- **chainId (API):** `avax-fuji`
- **EVM Chain ID:** 43113 (0xa869)
- **RPC:** `https://api.avax-test.network/ext/bc/C/rpc`
- **Explorer:** https://testnet.snowtrace.io
- **Native token:** AVAX (test); use a [faucet](https://faucet.avax.network/) for test AVAX.

---

## Examples (AVAX)

### Deploy ERC-20 token on Avalanche C-Chain

**Request:**
```json
{
  "chainId": "avax-mainnet",
  "privateKey": "YOUR_PRIVATE_KEY_HEX",
  "contractName": "MyToken",
  "constructorArgs": ["My Token", "MTK", "1000000000000000000000000"],
  "sources": {
    "MyToken.sol": {
      "content": "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n\nimport \"@openzeppelin/contracts/token/ERC20/ERC20.sol\";\n\ncontract MyToken is ERC20 {\n    constructor(string memory name, string memory symbol, uint256 initialSupply) ERC20(name, symbol) {\n        _mint(msg.sender, initialSupply);\n    }\n}"
    }
  }
}
```

### Deploy same token on Fuji Testnet

Use `avax-fuji` and ensure the deployer wallet has test AVAX:

```json
{
  "chainId": "avax-fuji",
  "privateKey": "YOUR_PRIVATE_KEY_HEX",
  "contractName": "MyToken",
  "constructorArgs": ["My Token", "MTK", "1000000000000000000000000"],
  "sources": {
    "MyToken.sol": {
      "content": "..."
    }
  }
}
```

### Deploy NFT (ERC-721) on Avalanche C-Chain

```json
{
  "chainId": "avax-mainnet",
  "privateKey": "YOUR_PRIVATE_KEY_HEX",
  "contractName": "MyNFT",
  "constructorArgs": ["My NFT", "MNFT"],
  "sources": {
    "MyNFT.sol": {
      "content": "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n\nimport \"@openzeppelin/contracts/token/ERC721/ERC721.sol\";\n\ncontract MyNFT is ERC721 {\n    uint256 private _nextTokenId;\n    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}\n    function mint(address to) public {\n        uint256 tokenId = _nextTokenId++;\n        _safeMint(to, tokenId);\n    }\n}"
    }
  }
}
```

### Deploy to an Avalanche L1 (e.g. DFK)

```json
{
  "chainId": "avax-dfk",
  "privateKey": "YOUR_PRIVATE_KEY_HEX",
  "contractName": "MyContract",
  "constructorArgs": [],
  "sources": {
    "MyContract.sol": {
      "content": "..."
    }
  }
}
```

---

## Response format

**Success (200):**
```json
{
  "success": true,
  "result": {
    "address": "0x...",
    "hash": "0x...",
    "explorerUrl": "https://snowtrace.io/tx/0x..."
  }
}
```

**Error (4xx/5xx):**
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Summary

- **Yes, the API works for AVAX launches.** Use `chainId`: `avax-mainnet` for production and `avax-fuji` for testnet.
- Mainnet: Chain ID 43114, RPC `https://api.avax.network/ext/bc/C/rpc`, explorer [snowtrace.io](https://snowtrace.io).
- Testnet: Chain ID 43113, RPC `https://api.avax-test.network/ext/bc/C/rpc`, explorer [testnet.snowtrace.io](https://testnet.snowtrace.io).
- For subnets, use the listed `chainId` values (e.g. `avax-dfk`, `avax-dexalot`) or provide a custom `rpcUrl`.
