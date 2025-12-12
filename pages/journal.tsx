import React, { useState, useEffect } from "react";
import {
  createJournal,
  fetchJournal,
  updateJournal,
  deleteJournal,
  listAllJournals,
} from "../lib/solanaClient";

declare global {
  interface Window {
    solana?: any;
  }
}

export default function JournalPage() {
  const [connected, setConnected] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [entries, setEntries] = useState<any[]>([]);
  const [log, setLog] = useState("");

  useEffect(() => {
    const provider = window.solana;
    if (provider?.isPhantom) {
      provider.on("connect", () => setConnected(true));
      provider.on("disconnect", () => setConnected(false));
      setConnected(provider.isConnected);
    }
  }, []);

  const connectWallet = async () => {
    try {
      await window.solana.connect();
      setConnected(true);
      setLog("Connected: " + window.solana.publicKey.toBase58());
    } catch (err) {
      setLog("Connection failed.");
    }
  };

  const createEntry = async (e: any) => {
    e.preventDefault();
    try {
      const r = await createJournal(title, content);
      setLog("Created: " + r.tx);
      loadEntries();

    } catch (e: any) {
      setLog("Create failed: " + e.message);
    }
  };

  const loadEntries = async () => {
    try {
      const all = await listAllJournals();
      setEntries(all);
    } catch (e: any) {
      setLog("Load failed: " + e.message);
    }
  };

  const doUpdate = async (t: string) => {
    const c = prompt("New content:");
    if (!c) return;
    try {
      const tx = await updateJournal(t, c);
      setLog("Updated: " + tx);
      loadEntries();
    } catch (e: any) {
      setLog("Update failed: " + e.message);
    }
  };

  const doDelete = async (t: string) => {
    if (!confirm("Delete entry?")) return;
    try {
      const tx = await deleteJournal(t);
      setLog("Deleted: " + tx);
      loadEntries();
    } catch (e: any) {
      setLog("Delete failed: " + e.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Journal CRUD</h1>

      {!connected ? (
        <button onClick={connectWallet}>Connect Phantom</button>
      ) : (
        <p>Wallet Connected</p>
      )}

      <button onClick={loadEntries}>Load Entries</button>

      <h2>Create Entry</h2>
      <form onSubmit={createEntry}>
        <input
          placeholder="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <br />
        <textarea
          placeholder="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <br />
        <button type="submit">Create</button>
      </form>

      <h2>Entries</h2>

      {entries.map((e) => (
        <div
          key={e.pubkey}
          style={{
            padding: 10,
            margin: "10px 0",
            border: "1px solid #ddd",
          }}
        >
          <p>
            <b>Title:</b> {e.data.title}
          </p>
          <p>
            <b>Content:</b> {e.data.content}
          </p>
          <button onClick={() => doUpdate(e.data.title)}>Update</button>
          <button onClick={() => doDelete(e.data.title)}>Delete</button>
        </div>
      ))}

      <h3>Log</h3>
      <pre>{log}</pre>
    </div>
  );
}
