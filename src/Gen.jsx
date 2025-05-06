import React, { useState, useEffect } from "react";
import * as openpgp from "openpgp";
import WitnessForm from "./pages/WitnessForm";
import OfficerWitnessViewer from "./pages/OfficerWitnessViewer";

const Gen = () => {
  const [officerPublicKey, setOfficerPublicKey] = useState("");
  const [generatedPrivateKey, setGeneratedPrivateKey] = useState("");

  useEffect(() => {
    async function generateKey() {
      const { publicKey, privateKey } = await openpgp.generateKey({
        type: "rsa",
        rsaBits: 2048,
        userIDs: [{ name: "Officer A", email: "officer@example.com" }],
        passphrase: "officer123",
      });
      setOfficerPublicKey(publicKey);
      setGeneratedPrivateKey(privateKey);
      console.log("Public Key:\n", publicKey);
      console.log("Private Key (use in OfficerWitnessViewer):\n", privateKey);
    }
    generateKey();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Witness Complaint System</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <WitnessForm complaintId={1} officerPublicKey={officerPublicKey} />
        <OfficerWitnessViewer complaintId={1} />
      </div>
      {generatedPrivateKey && (
        <div className="mt-8 p-4 border rounded bg-gray-100">
          <h3 className="font-semibold mb-2">Generated Private Key (for testing):</h3>
          <pre className="text-sm">{generatedPrivateKey}</pre>
          <p className="text-sm text-gray-600">Passphrase: officer123</p>
        </div>
      )}
    </div>
  );
};

export default Gen;