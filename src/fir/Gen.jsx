import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import WitnessForm from "./pages/WitnessForm";
import OfficerWitnessViewer from "./pages/OfficerWitnessPage";

const Gen = () => {
  const [officerAddress, setOfficerAddress] = useState("");

  useEffect(() => {
    // Use the appropriate method for ethers v6
    const wallet = ethers.Wallet.createRandom();
    setOfficerAddress(wallet.address);
    console.log("Officer Address:", wallet.address);
    console.log("Passphrase (for OfficerWitnessViewer): witness123");
  }, []); // Empty dependency array ensures single execution

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Witness Complaint System</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <WitnessForm complaintId={1} officerAddress={officerAddress} />
        <OfficerWitnessViewer complaintId={1} />
      </div>
      <div className="mt-8 p-4 border rounded bg-gray-100">
        <h3 className="font-semibold mb-2">Test Passphrase (for OfficerWitnessViewer):</h3>
        <pre className="text-sm">witness123</pre>
      </div>
    </div>
  );
};

export default Gen;