import { ethers } from 'ethers';
import {
    Connection,
    PublicKey,
    Transaction,
    SystemProgram,
    Keypair,
    sendAndConfirmTransaction
} from "@solana/web3.js";
import {
    TOKEN_PROGRAM_ID,
    createInitializeMintInstruction,
    MINT_SIZE,
    getMinimumBalanceForRentExemptMint,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    createMintToInstruction
} from "@solana/spl-token";
import dotenv from 'dotenv';
import bs58 from 'bs58';

dotenv.config();

export async function deployEVM(artifact, rpcUrl, privateKey, constructorArgs = [], options = {}) {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`Deploying ${artifact.name} to ${rpcUrl}...`);

    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    const contract = await factory.deploy(...constructorArgs, options);

    await contract.waitForDeployment();
    const address = await contract.getAddress();

    return {
        address,
        hash: contract.deploymentTransaction().hash,
        name: artifact.name
    };
}

export async function deploySolanaToken(config, rpcUrl, privateKeyBase58) {
    const connection = new Connection(rpcUrl || "https://api.devnet.solana.com", "confirmed");

    // Decode private key (assuming it's a base58 string or a byte array)
    // For simplicity in this real API, we expect a Uint8Array represented as JSON or a base58 string.
    // Let's assume a system key or provided key.

    let payer;
    try {
        if (privateKeyBase58.startsWith('[')) {
            payer = Keypair.fromSecretKey(new Uint8Array(JSON.parse(privateKeyBase58)));
        } else {
            payer = Keypair.fromSecretKey(bs58.decode(privateKeyBase58));
        }
    } catch (e) {
        throw new Error("Invalid Solana private key. Use Base58 string or JSON array.");
    }

    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;

    console.log("Solana Token Deployment Started...");

    const lamports = await getMinimumBalanceForRentExemptMint(connection);

    const transaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mint,
            space: MINT_SIZE,
            lamports,
            programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(mint, 9, payer.publicKey, payer.publicKey, TOKEN_PROGRAM_ID)
    );

    const ata = await getAssociatedTokenAddress(mint, payer.publicKey);
    transaction.add(
        createAssociatedTokenAccountInstruction(payer.publicKey, ata, payer.publicKey, mint)
    );

    const amount = BigInt(config.totalSupply || 1000000) * BigInt(Math.pow(10, 9));
    transaction.add(
        createMintToInstruction(mint, ata, payer.publicKey, amount)
    );

    const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [payer, mintKeypair]
    );

    return {
        success: true,
        address: mint.toBase58(),
        signature: signature
    };
}
