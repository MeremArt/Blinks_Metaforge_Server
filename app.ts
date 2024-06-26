import express, { Request, Response } from "express";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import bodyParser from "body-parser";
import cors from "cors";
import { prepareTransaction } from "./transaction-utils";
// Adjust the path as necessary
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
require("dotenv").config();

const DONATION_DESTINATION_WALLET =
  "3h4AtoLTh3bWwaLhdtgQtcC3a3Tokb8NJbtqR9rhp7p6";
const DONATION_AMOUNT_SOL_OPTIONS: number[] = [1, 5, 10];
const DEFAULT_DONATION_AMOUNT_SOL: number = 1;

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get("/api/mint", (req: Request, res: Response) => {
  const { icon, title, description } = getDonateInfo();
  const amountParameterName = "amount";
  const response = {
    icon,
    label: `${DEFAULT_DONATION_AMOUNT_SOL} SOL`,
    title,
    description,
    links: {
      actions: [
        ...DONATION_AMOUNT_SOL_OPTIONS.map((amount) => ({
          label: `${amount} SOL`,
          href: `/api/mint/${amount}`,
        })),
        {
          href: `/api/mint/{${amountParameterName}}`,
          label: "Mint",
          parameters: [
            {
              name: amountParameterName,
              label: "Enter a custom SOL amount",
            },
          ],
        },
      ],
    },
  };
  res.status(200).json(response);
});

app.get("/api/mint/:amount", (req: Request, res: Response) => {
  const amount: string = req.params.amount;
  const { icon, title, description } = getDonateInfo();
  const response = {
    icon,
    label: `${amount} SOL`,
    title,
    description,
  };
  res.status(200).json(response);
});

app.post("/api/mint/:amount?", async (req: Request, res: Response) => {
  const amount: string =
    req.params.amount || DEFAULT_DONATION_AMOUNT_SOL.toString();
  const { account } = req.body;

  const parsedAmount: number = parseFloat(amount);
  const transaction = await prepareDonateTransaction(
    new PublicKey(account),
    new PublicKey(DONATION_DESTINATION_WALLET),
    parsedAmount * LAMPORTS_PER_SOL
  );
  const response = {
    transaction: Buffer.from(transaction.serialize()).toString("base64"),
  };
  res.status(200).json(response);
});

function getDonateInfo(): { icon: string; title: string; description: string } {
  const icon: string =
    "https://res.cloudinary.com/dtfvdjvyr/image/upload/v1718067656/Frame_150_3_mqxm7c.png";
  const title: string = "Mint BonkBull";
  const description: string =
    "MetaForge iNFTs empower brands and creators to deepen on-chain connections with customers and communities.";
  return { icon, title, description };
}

async function prepareDonateTransaction(
  sender: PublicKey,
  recipient: PublicKey,
  lamports: number
) {
  const payer: PublicKey = sender;
  const instructions = [
    SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: recipient,
      lamports: lamports,
    }),
  ];
  return prepareTransaction(instructions, payer);
}

const PORT: number | string = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
