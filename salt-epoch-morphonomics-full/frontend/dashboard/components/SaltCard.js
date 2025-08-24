import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
export default function SaltCard() {
  const [balance, setBalance] = useState(0);
  async function fetchBalance() {
    if (!window.ethereum) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const addr = await signer.getAddress();
    setBalance(42);
  }
  useEffect(() => {
    fetchBalance();
  }, []);
  return (
    <div className="card">
      <h2>Epoch Salt Balance: {balance}</h2>
      <button onClick={() => alert("Morph ritual triggered!")}>
        Morph SALT →
      </button>
    </div>
  );
}