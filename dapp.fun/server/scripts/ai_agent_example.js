import axios from 'axios';

/**
 * This is an example of how an AI Agent or Bot would use the Dapp.Fun API
 * to programmatically deploy a smart contract for a user.
 */

async function spawnDapp() {
    const API_URL = 'http://localhost:3001';

    // 1. The AI Agent decides what contract to build
    const solidityCode = `
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.20;

    import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

    contract AgentToken is ERC20 {
        constructor(string memory name, string memory symbol) ERC20(name, symbol) {
            _mint(msg.sender, 1000000 * 10 ** decimals());
        }
    }
    `;

    console.log("🤖 AI Agent: Initiating dApp deployment...");

    try {
        // 2. Call the Dapp.Fun API to deploy
        const response = await axios.post(`${API_URL}/deploy`, {
            chainId: 'omega-testnet',
            config: {
                name: "AI Agent Token",
                symbol: "AIT"
            },
            sources: {
                "AgentToken.sol": { content: solidityCode }
            },
            constructorArgs: ["AI Agent Token", "AIT"],
            // privateKey: "0x..." // Optional: pass user's key or use system default
        });

        if (response.data.success) {
            console.log("✅ Deployment Successful!");
            console.log(`📍 Contract Address: ${response.data.result.address}`);
            console.log(`🔗 Transaction Hash: ${response.data.result.hash}`);
            console.log(`🌍 View on Explorer: https://explorer.omeganetwork.co/address/${response.data.result.address}`);
        }
    } catch (error) {
        console.error("❌ Agent Failed to deploy:", error.response?.data || error.message);
    }
}

spawnDapp();
