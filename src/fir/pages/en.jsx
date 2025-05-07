// App.js
import React, { useState } from "react";
import { ethers } from "ethers";
import { create as ipfsHttpClient } from "ipfs-http-client";
import CryptoJS from "crypto-js";

const ipfs = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");

const CONTRACT_ADDRESS = "0x28964BFC5526aDA90D3503B3bCd2c35b93fB4F78";
const ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "complaintId", type: "uint256" },
      { internalType: "string", name: "encryptedIpfsHash", type: "string" },
    ],
    name: "SubmitWitnessInfo",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export default function App() {
  const [complaintId, setComplaintId] = useState("");
  const [message, setMessage] = useState("");
  const [secret, setSecret] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async () => {
    if (!window.ethereum) return alert("Please install MetaMask");

    try {
      setStatus("Encrypting...");
      const iv = CryptoJS.lib.WordArray.random(16);
      const encrypted = CryptoJS.AES.encrypt(
        message,
        CryptoJS.enc.Utf8.parse(secret),
        { iv }
      );
      const payload = {
        iv: iv.toString(CryptoJS.enc.Hex),
        data: encrypted.ciphertext.toString(CryptoJS.enc.Hex),
      };

      setStatus("Uploading to IPFS...");
      const result = await ipfs.add(JSON.stringify(payload));
      const encryptedIpfsObject = JSON.stringify({
        cid: result.path,
        ...payload,
      });

      setStatus("Submitting to contract...");
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.SubmitWitnessInfo(
        complaintId,
        encryptedIpfsObject
      );
      await tx.wait();

      setStatus("✅ Witness info submitted!");
    } catch (err) {
      console.error(err);
      setStatus("❌ Error submitting data.");
    }
  };

  return (
    <div className="App" style={{ padding: 20 }}>
      <h2>Submit Encrypted Witness Info</h2>
      <input
        placeholder="Complaint ID"
        onChange={(e) => setComplaintId(e.target.value)}
      />
      <br />
      <textarea
        placeholder="Enter Message"
        onChange={(e) => setMessage(e.target.value)}
      />
      <br />
      <input
        placeholder="Secret Key"
        onChange={(e) => setSecret(e.target.value)}
      />
      <br />
      <button onClick={handleSubmit}>Submit</button>
      <p>{status}</p>
    </div>
  );
}
