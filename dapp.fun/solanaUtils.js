import {
    Connection,
    PublicKey,
    Transaction,
    SystemProgram,
    Keypair
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
import { Buffer } from "buffer";

if (typeof window !== "undefined") {
    window.Buffer = Buffer;
}

export const solanaDeployToken = async (provider, { name, symbol, supply }) => {
    // Use Devnet for testing if not specified, or Mainnet if preferred
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const payer = provider.publicKey;
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;

    console.log("Real Solana Token Forge Started...");
    console.log("Mint Address:", mint.toBase58());

    try {
        const lamports = await getMinimumBalanceForRentExemptMint(connection);

        const transaction = new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: payer,
                newAccountPubkey: mint,
                space: MINT_SIZE,
                lamports,
                programId: TOKEN_PROGRAM_ID,
            }),
            createInitializeMintInstruction(mint, 9, payer, payer, TOKEN_PROGRAM_ID)
        );

        const ata = await getAssociatedTokenAddress(mint, payer);
        transaction.add(
            createAssociatedTokenAccountInstruction(payer, ata, payer, mint)
        );

        const amount = BigInt(supply) * BigInt(10 ** 9);
        transaction.add(
            createMintToInstruction(mint, ata, payer, amount)
        );

        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        transaction.feePayer = payer;

        // Partially sign with the mint keypair
        transaction.partialSign(mintKeypair);

        // Request signature from Phantom
        const signedTx = await provider.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signedTx.serialize());

        await connection.confirmTransaction(signature);

        return {
            success: true,
            address: mint.toBase58(),
            signature: signature
        };
    } catch (err) {
        console.error("Solana Deployment Failed:", err);
        throw err;
    }
};
