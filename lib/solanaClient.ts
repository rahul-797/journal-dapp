import * as anchor from "@project-serum/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import idl from "../idl/idl.json";

// PROGRAM ID — set with env or hardcode
const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ||
    "5GEgJnuMG7VgAbt8dU31tqeVzmk1UokxUBc1N8y4u89v"
);

// RPC endpoint (Playground = devnet)
const NETWORK = "http://127.0.0.1:8899";

function getWallet(): anchor.Wallet {
  const provider = (window as any).solana;
  if (!provider || !provider.isPhantom) {
    throw new Error("Phantom wallet not found.");
  }
  return {
    publicKey: provider.publicKey,
    signTransaction: provider.signTransaction,
    signAllTransactions: provider.signAllTransactions,
  } as anchor.Wallet;
}

export function getProvider() {
  const wallet = getWallet();
  const connection = new anchor.web3.Connection(NETWORK, "processed");
  return new anchor.AnchorProvider(
    connection,
    wallet,
    anchor.AnchorProvider.defaultOptions()
  );
}

export function getProgram() {
  const provider = getProvider();
  return new anchor.Program(idl as anchor.Idl, PROGRAM_ID, provider);
}

function titleSeedBytes(title: string) {
  return Buffer.from(title.normalize("NFC"), "utf8");
}

export function derivePdaSync(owner: PublicKey, title: string) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("journal_entry"), owner.toBuffer(), titleSeedBytes(title)],
    PROGRAM_ID
  );
}

export async function createJournal(title: string, content: string) {
  const provider = getProvider();
  const program = getProgram();
  const owner = provider.wallet.publicKey;
  const [pda] = derivePdaSync(owner, title);

  const tx = await program.methods
    .createJournalEntry(title, content)
    .accounts({
      journalEntry: pda,
      owner,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return { tx, pda };
}

export async function fetchJournal(title: string) {
  const provider = getProvider();
  const program = getProgram();
  const owner = provider.wallet.publicKey;
  const [pda] = derivePdaSync(owner, title);

  const account = await program.account.journalEntry.fetch(pda);
  return { pda, account };
}

export async function updateJournal(title: string, newContent: string) {
  const provider = getProvider();
  const program = getProgram();
  const owner = provider.wallet.publicKey;
  const [pda] = derivePdaSync(owner, title);
  
  return await program.methods
    .updateJournalEntry(title, newContent)
    .accounts({
      journalEntry: pda,
      owner,
    })
    .rpc();
}

export async function deleteJournal(title: string) {
  const provider = getProvider();
  const program = getProgram();
  const owner = provider.wallet.publicKey;
  const [pda] = derivePdaSync(owner, title);

  return await program.methods
    .deleteJournalEntry(title)
    .accounts({
      journalEntry: pda,
      owner,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

export async function listAllJournals() {
  const provider = getProvider();
  const connection = provider.connection;

  const accounts = await connection.getProgramAccounts(PROGRAM_ID);
  const program = getProgram();

  const decoded: any[] = [];
  for (const acc of accounts) {
    try {
      const data = await program.account.journalEntry.fetch(acc.pubkey);
      decoded.push({ pubkey: acc.pubkey.toBase58(), data });
    } catch (_) {}
  }

  return decoded;
}
