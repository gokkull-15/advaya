import React, { useState } from "react";
import { ethers, Wallet } from "ethers";
import WitnessContractABI from "./abis/WitnessComplaints.json";

const contractAddress = "0x28964BFC5526aDA90D3503B3bCd2c35b93fB4F78"; // Update with your deployed address

const OfficerWitnessViewer = ({ complaintId }) => {
  const [passphrase, setPassphrase] = useState("");
  const [witnessMessage, setWitnessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const getEncryptedIpfsHash = async () => {
    if (!window.ethereum) throw new Error("Please install MetaMask");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, WitnessContractABI, provider);
    const witnesses = await contract.complaintWitness(complaintId, 0);
    return witnesses.encryptedIpfsHash;
  };

  const fetchFromIPFS = async (cid) => {
    try {
      const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
      if (!response.ok) throw new Error(`IPFS fetch failed: ${response.status}`);
      return await response.text();
    } catch (err) {
      throw new Error("IPFS fetch failed: " + err.message);
    }
  };

  const decryptMessage = async (encryptedText) => {
    try {
      // In ethers v6, use fromEncryptedJson instead of decrypt
      const wallet = await ethers.Wallet.fromEncryptedJson(encryptedText, passphrase);
      return wallet.privateKey; // The decrypted data is the private key
    } catch (err) {
      throw new Error("Decryption failed: " + err.message);
    }
  };

  const handleViewWitness = async () => {
    try {
      setLoading(true);
      const cid = await getEncryptedIpfsHash();
      const encryptedData = await fetchFromIPFS(cid);
      const decrypted = await decryptMessage(encryptedData);
      setWitnessMessage(decrypted);
    } catch (err) {
      console.error("Decryption error:", err);
      alert("Failed to decrypt: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded shadow-md bg-white max-w-md">
      <h2 className="text-xl font-bold mb-4">Witness Info Viewer (Officer Only)</h2>
      <input
        type="password"
        className="w-full p-2 mb-2 border"
        placeholder="Enter passphrase (witness123 for testing)"
        value={passphrase}
        onChange={(e) => setPassphrase(e.target.value)}
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={handleViewWitness}
        disabled={loading || !passphrase}
      >
        {loading ? "Decrypting..." : "View Witness Info"}
      </button>
      {witnessMessage && (
        <div className="mt-4 p-3 border bg-gray-100">
          <h3 className="font-semibold mb-2">Decrypted Message:</h3>
          <pre>{witnessMessage}</pre>
        </div>
      )}
    </div>
  );
};

export default OfficerWitnessViewer;