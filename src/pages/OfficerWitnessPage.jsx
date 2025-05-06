import React, { useState } from "react";
import { ethers } from "ethers";
import * as openpgp from "openpgp";
import WitnessContractABI from "./abis/WitnessComplaints.json";

const contractAddress = "0x28964BFC5526aDA90D3503B3bCd2c35b93fB4F78"; // Update with your deployed address

const OfficerWitnessViewer = ({ complaintId }) => {
  const [privateKeyArmored, setPrivateKeyArmored] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [witnessMessage, setWitnessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const getEncryptedIpfsHash = async () => {
    if (!window.ethereum) throw new Error("Please install MetaMask");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, WitnessContractABI, provider);
    const witnesses = await contract.compliantWitness(complaintId, 0); // First witness
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
      const privateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyArmored }),
        passphrase,
      });
      const message = await openpgp.readMessage({ armoredMessage: encryptedText });
      const { data: decrypted } = await openpgp.decrypt({
        message,
        decryptionKeys: privateKey,
      });
      return decrypted;
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
      console.error("Error while decrypting:", err);
      alert("  decrypted" );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded shadow-md bg-white max-w-md">
      <h2 className="text-xl font-bold mb-4">Witness Info Viewer (Officer Only)</h2>
      <textarea
        className="w-full p-2 mb-2 border"
        rows={6}
        placeholder="Paste your armored private key here..."
        value={privateKeyArmored}
        onChange={(e) => setPrivateKeyArmored(e.target.value)}
      />
      <input
        type="password"
        className="w-full p-2 mb-2 border"
        placeholder="Private key passphrase"
        value={passphrase}
        onChange={(e) => setPassphrase(e.target.value)}
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={handleViewWitness}
        disabled={loading || !privateKeyArmored || !passphrase}
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