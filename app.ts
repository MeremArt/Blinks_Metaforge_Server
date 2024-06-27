import express, { Request, Response } from "express";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import bodyParser from "body-parser";
import cors from "cors";
import { connection, prepareTransaction } from "./transaction-utils.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
} from "@solana/spl-token";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const DONATION_DESTINATION_WALLET =
  "3h4AtoLTh3bWwaLhdtgQtcC3a3Tokb8NJbtqR9rhp7p6";
const DONATION_AMOUNT_BONK: number = 100_000;
const BONK_MINT_ADDRESS = new PublicKey(
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"
);

// Define network fee in SOL (adjust as per current network fee)
const NETWORK_FEE_SOL = 0.002;

const sdk = require("api")("@underdog/v2.0#5vgec2olujb1d8j");
sdk.server("https://devnet.underdogprotocol.com");
sdk.auth("29022c05792885.31b9ac2f964646d29d047260f4866c3c");

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get("/api/mint", (req: Request, res: Response) => {
  const { icon, title, description } = getDonateInfo();
  const response = {
    icon,
    label: `${DONATION_AMOUNT_BONK} BONK`,
    title,
    description,
    links: {
      actions: [
        {
          label: "Mint",
          href: `/api/mint`,
        },
      ],
    },
  };
  res.status(200).json(response);
});

app.post("/api/mint", async (req: Request, res: Response) => {
  try {
    const { account } = req.body;

    if (!account) {
      return res.status(400).json({ error: "Account is required" });
    }

    const transaction = await prepareDonateTransaction(
      new PublicKey(account),
      new PublicKey(DONATION_DESTINATION_WALLET),
      DONATION_AMOUNT_BONK
    );

    // Serialize the transaction
    const serializedTransaction = Buffer.from(transaction.serialize()).toString(
      "base64"
    );

    // Calculate network fee in lamports (1 SOL = 1,000,000 lamports)
    const lamportsPerSol = 1000000;
    const networkFeeLamports = Math.ceil(NETWORK_FEE_SOL * lamportsPerSol);

    // Add network fee instruction to the transaction
    transaction.add(
      createTransferInstruction(
        new PublicKey(account),
        new PublicKey("YOUR_NETWORK_FEE_RECEIVER_ADDRESS"),
        new PublicKey("YOUR_PAYER_ACCOUNT_PUBLIC_KEY"),
        networkFeeLamports
      )
    );

    // Send the transaction and await confirmation (omitted here, implement as needed)
    // ...

    const response = {
      transaction: serializedTransaction,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error processing transaction:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

async function prepareDonateTransaction(
  sender: PublicKey,
  recipient: PublicKey,
  amount: number
) {
  const senderTokenAccount = await getAssociatedTokenAddress(
    BONK_MINT_ADDRESS,
    sender
  );
  const recipientTokenAccount = await getAssociatedTokenAddress(
    BONK_MINT_ADDRESS,
    recipient
  );

  const instructions: TransactionInstruction[] = [
    createTransferInstruction(
      senderTokenAccount,
      recipientTokenAccount,
      sender,
      amount
    ),
  ];

  return prepareTransaction(instructions, sender);
}

function getDonateInfo(): { icon: string; title: string; description: string } {
  const icon: string =
    "https://res.cloudinary.com/dtfvdjvyr/image/upload/v1718067656/Frame_150_3_mqxm7c.png";
  const title: string = "Mint BonkBull";
  const description: string =
    "MetaForge iNFTs empower brands and creators to deepen on-chain connections with customers and communities.";
  return { icon, title, description };
}

const PORT: number | string = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
