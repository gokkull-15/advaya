import React, { useState } from "react";
import { ethers, Wallet } from "ethers";
import { NFTStorage, File } from "nft.storage";
import WitnessContractABI from "./abis/WitnessComplaints.json";

const NFT_STORAGE_TOKEN = import.meta.env.VITE_NFT_STORAGE_TOKEN;
const contractAddress = "0x28964BFC5526aDA90D3503B3bCd2c35b93fB4F78"; // Update with your deployed address

const WitnessForm = ({ complaintId, officerAddress }) => {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const encryptMessage = async (text) => {
    console.log("ethers version:", ethers.version); // Should be 5.7.2
    console.log("Wallet.encrypt:", Wallet.encrypt); // Should be a function
    if (!officerAddress || !ethers.utils.isAddress(officerAddress)) {
      throw new Error("Invalid or missing officer address");
    }
    try {
      const passphrase = "witness123"; // For testing; derive securely in production
      const encrypted = await Wallet.encrypt(passphrase, text);
      return encrypted; // JSON string
    } catch (err) {
      throw new Error("Encryption failed: " + err.message);
    }
  };

  const uploadToNFTStorage = async (encryptedText) => {
    if (!NFT_STORAGE_TOKEN) throw new Error("NFT_STORAGE_TOKEN is missing. Check .env");
    try {
      console.log("NFT_STORAGE_TOKEN:", NFT_STORAGE_TOKEN); // Debug
      const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });
      const file = new File([encryptedText], "witness.txt", { type: "text/plain" });
      const cid = await client.storeBlob(file);
      return cid;
    } catch (err) {
      throw new Error("IPFS upload failed: " + err.message);
    }
  };

  const sendToContract = async (cid) => {
    if (!window.ethereum) throw new Error("Please install MetaMask");
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, WitnessContractABI, signer);
    const tx = await contract.submitWitnessInfo(complaintId, cid);
    await tx.wait();
  };

  const handleSubmit = async () => {
    try {
      setStatus("Encrypting...");
      const encrypted = await encryptMessage(message);
      setStatus("Uploading to IPFS...");
      const cid = await uploadToNFTStorage(encrypted);
      setStatus("Submitting to contract...");
      await sendToContract(cid);
      setStatus("✅ Submitted successfully!");
      setMessage("");
    } catch (err) {
      console.error("Submission error:", err);
      setStatus("❌ Error: " + err.message);
    }
  };

  return (
    <div className="p-4 border shadow rounded max-w-md bg-white">
      <h2 className="text-xl font-bold mb-4">Witness Submission Form</h2>
      <textarea
        className="w-full p-2 border mb-2"
        rows={5}
        value={message}
        placeholder="Describe what you witnessed..."
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded"
        disabled={!message.trim() || !officerAddress}
      >
        Submit
      </button>
      <p className="mt-2 text-sm text-gray-700">{status}</p>
    </div>
  );
};

export default WitnessForm;