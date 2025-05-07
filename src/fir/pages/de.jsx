// OfficerViewer.js
import React, { useState } from "react";
import { ethers } from "ethers";
import CryptoJS from "crypto-js";

const CONTRACT_ADDRESS = "0x28964BFC5526aDA90D3503B3bCd2c35b93fB4F78";
const ABI = [
  {
    inputs: [{ internalType: "uint256", name: "complaintId", type: "uint256" }],
    name: "getWitness",
    outputs: [
      {
        components: [
          { internalType: "string", name: "encryptedIpfsHash", type: "string" },
          { internalType: "address", name: "submittedBy", type: "address" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
        ],
        internalType: "struct WitnessComplaints.WitnessInfo[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export default function OfficerViewer() {
  const [complaintId, setComplaintId] = useState("");
  const [secret, setSecret] = useState("");
  const [witnessMessages, setWitnessMessages] = useState([]);
  const [status, setStatus] = useState("");

  const fetchWitnessInfo = async () => {
    if (!window.ethereum) return alert("Install MetaMask");
    setStatus("Fetching witness info...");

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const result = await contract.getWitness(complaintId);

      const decryptedMessages = [];

      for (const witness of result) {
        const encryptedObj = JSON.parse(witness.encryptedIpfsHash);
        const res = await fetch(`https://ipfs.io/ipfs/${encryptedObj.cid}`);
        const ipfsPayload = await res.json();

        const decrypted = CryptoJS.AES.decrypt(
          { ciphertext: CryptoJS.enc.Hex.parse(ipfsPayload.data) },
          CryptoJS.enc.Utf8.parse(secret),
          { iv: CryptoJS.enc.Hex.parse(ipfsPayload.iv) }
        );

        const plainText = decrypted.toString(CryptoJS.enc.Utf8);
        decryptedMessages.push({
          message: plainText,
          submittedBy: witness.submittedBy,
          timestamp: new Date(witness.timestamp * 1000).toLocaleString(),
        });
      }

      setWitnessMessages(decryptedMessages);
      setStatus("Decryption complete.");
    } catch (err) {
      console.error(err);
      setStatus("Error while decrypting.");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Officer Viewer</h2>
      <input
        placeholder="Complaint ID"
        onChange={(e) => setComplaintId(e.target.value)}
      />
      <input
        placeholder="Secret Key"
        onChange={(e) => setSecret(e.target.value)}
      />
      <button onClick={fetchWitnessInfo}>View</button>
      <p>{status}</p>

      {witnessMessages.map((msg, idx) => (
        <div
          key={idx}
          style={{ border: "1px solid gray", marginTop: 10, padding: 10 }}
        >
          <p>
            <strong>From:</strong> {msg.submittedBy}
          </p>
          <p>
            <strong>Time:</strong> {msg.timestamp}
          </p>
          <p>
            <strong>Message:</strong> {msg.message}
          </p>
        </div>
      ))}
    </div>
  );
}
