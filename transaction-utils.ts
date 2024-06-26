import {
  clusterApiUrl,
  Connection,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
  Message,
  VersionedMessage,
} from "@solana/web3.js";

const environment: string = process.env.ENVIRONMENT || "development";

const rpcUrl: string =
  environment === "production"
    ? process.env.RPC_URL || clusterApiUrl("mainnet-beta")
    : process.env.RPC_URL || clusterApiUrl("devnet");

const connection: Connection = new Connection(rpcUrl);

async function prepareTransaction(
  instructions: TransactionInstruction[],
  payer: PublicKey
): Promise<VersionedTransaction> {
  const blockhash: string = await connection
    .getLatestBlockhash({ commitment: "max" })
    .then((res) => res.blockhash);

  // Create a TransactionMessage
  const transactionMessage = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions,
  });

  // Compile the TransactionMessage to a VersionedMessage
  const messageV0: VersionedMessage = transactionMessage.compileToV0Message();

  return new VersionedTransaction(messageV0);
}

export { connection, prepareTransaction };
