import { FiPhone, FiUsers, FiSearch, FiFilter, FiMapPin, FiArrowRight, FiX } from 'react-icons/fi';
import { FaAmbulance, FaFileAlt, FaCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import BG from "./assets/image.png";

const CONTRACT_ADDRESS = "0xCA0664F941674BbBebd070f1452997f6887Ecd42";
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_complaint",
        "type": "string"
      }
    ],
    "name": "addComplaint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "complaintIndex",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "complaint",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "ComplaintAdded",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "getAllComplaints",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_index",
        "type": "uint256"
      }
    ],
    "name": "getComplaintByIndex",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getComplaintCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

function Dashboard() {
  const navigate = useNavigate();
  const [showFIRModal, setShowFIRModal] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const savedTranscript = localStorage.getItem('callTranscript') || 'No emergency calls recorded yet';

  // Check if wallet is connected
  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setCurrentAccount(accounts[0]);
          setWalletConnected(true);
          return true;
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
    return false;
  };

  const fetchComplaints = async () => {
    try {
      setLoadingComplaints(true);
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to view complaints');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const count = await contract.getComplaintCount();

      if (contract.getAllComplaints) {
        const allComplaints = await contract.getAllComplaints();
        setComplaints(allComplaints.map((text, id) => ({ id, text })));
      } else {
        const complaintsArray = [];
        for (let i = 0; i < count; i++) {
          const complaint = await contract.getComplaintByIndex(i);
          complaintsArray.push({ id: i, text: complaint });
        }
        setComplaints(complaintsArray);
      }
      setLoadingComplaints(false);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setLoadingComplaints(false);
      setTransactionStatus(`Error fetching complaints: ${error.message}`);
    }
  };

  const setupEventListeners = async () => {
    if (!window.ethereum) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    contract.on("ComplaintAdded", (complaintIndex, complaint, user) => {
      console.log(`New complaint added: Index ${complaintIndex} by ${user}`);
      fetchComplaints();
    });

    return () => {
      contract.removeAllListeners("ComplaintAdded");
    };
  };

  useEffect(() => {
    const init = async () => {
      await checkWalletConnection();
      await fetchComplaints();
      await setupEventListeners();
    };
    init();
    return () => {
      setupEventListeners().then(cleanup => cleanup && cleanup());
    };
  }, []);

  // Categorize based on keywords
  let transcriptCategory = 'low';
  const lowerTranscript = savedTranscript.toLowerCase();
  if (lowerTranscript.includes('murder') || lowerTranscript.includes('death') || lowerTranscript.includes('accident')) {
    transcriptCategory = 'critical';
  } else if (lowerTranscript.includes('robbery') || lowerTranscript.includes('fight') || lowerTranscript.includes('theft')) {
    transcriptCategory = 'medium';
  }

  const categoryStyles = {
    critical: {
      bg: 'bg-red-500 bg-opacity-20',
      text: 'text-red-400',
      border: 'border-red-500',
      label: 'Critical'
    },
    medium: {
      bg: 'bg-orange-500 bg-opacity-20',
      text: 'text-orange-400',
      border: 'border-orange-500',
      label: 'Medium Priority'
    },
    low: {
      bg: 'bg-yellow-500 bg-opacity-20',
      text: 'text-yellow-400',
      border: 'border-yellow-500',
      label: 'Low Priority'
    }
  };

  const style = categoryStyles[transcriptCategory];
  const formattedTranscript = savedTranscript.length > 100
    ? `${savedTranscript.substring(0, 100)}...`
    : savedTranscript;

    const handleFileFIR = async () => {
      try {
        setIsProcessing(true);
        if (!window.ethereum) throw new Error("MetaMask not installed");
    
        // Connect wallet if not connected
        if (!walletConnected) {
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          setCurrentAccount(accounts[0]);
          setWalletConnected(true);
        }
    
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const firContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    
        // Log before sending transaction
        console.log("Saving FIR with IPFS hash:", savedTranscript);
    
        const tx = await firContract.addComplaint(savedTranscript);
        console.log("Transaction sent:", tx.hash);
    
        const receipt = await tx.wait(); // Wait for confirmation
        console.log("Transaction confirmed:", receipt);
    
        setTransactionStatus("FIR successfully filed on blockchain!");
        await fetchComplaints(); // Refresh complaints list
      } catch (error) {
        console.error("Error filing FIR:", error);
        setTransactionStatus(`Error: ${error.message}`);
      } finally {
        setIsProcessing(false);
      }
    };

  const filteredComplaints = complaints.filter(complaint =>
    complaint.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed" style={{ backgroundImage: `url(${BG})` }}>
      <div className="bg-black bg-opacity-60 min-h-screen">
        {/* Header */}
        <header className="flex justify-between items-center p-6 bg-gradient-to-r from-purple-900 to-indigo-900 shadow-lg">
          <div className="text-3xl font-bold text-white font-['Pacifico']">TN-KUN</div>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-full bg-white hover:bg-gray-200 text-black font-['Roboto'] text-lg font-semibold transition-all duration-300 shadow-md flex items-center"
            >
              <FiUsers className="w-5 h-5 mr-2" />
              Home
            </button>
            <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg border border-white border-opacity-20">
              {walletConnected ? (
                <p className="text-white">
                  Connected: {`${currentAccount.substring(0, 6)}...${currentAccount.substring(38)}`}
                </p>
              ) : (
                <p className="text-yellow-400">Wallet not connected</p>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4 aclonica-regular">Officer Dashboard</h1>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto share-tech-mono-regular reveal">
  {"Manage complaints, file FIRs, and respond to emergencies".split("").map((char, index) => (
    <span key={index} style={{ '--i': index }}>
      {char === " " ? "\u00A0" : char}
    </span>
  ))}
  <br />
  {"securely on the blockchain.".split("").map((char, index) => (
    <span key={index + 1000} style={{ '--i': index + 50 }}>
      {char === " " ? "\u00A0" : char}
    </span>
  ))}
</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-red-400 mb-2 aclonica-regular">Urgent Tasks</h3>
              <span className="text-3xl font-bold text-white">
                {complaints.filter(c =>
                  c.text.toLowerCase().includes('murder') ||
                  c.text.toLowerCase().includes('accident') ||
                  c.text.toLowerCase().includes('death')
                ).length}
              </span>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-white mb-2 aclonica-regular">Total Complaints</h3>
              <span className="text-3xl font-bold text-white">{complaints.length}</span>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-white mb-2 aclonica-regular">Your Actions</h3>
              <span className="text-3xl font-bold text-white">
                {walletConnected ? complaints.filter(c => c.user === currentAccount).length : 'N/A'}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 shadow-lg mb-12">
            <h3 className="text-2xl font-bold text-white mb-4 aclonica-regular">Quick Actions</h3>
            <div className="flex flex-wrap gap-4">
              <button className="flex items-center gap-2 px-6 py-3 bg-red-500 bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors text-white">
                <FiPhone className="text-red-400" />
                <span className="font-medium vt323-regular text-xl">Emergency Services</span>
              </button>
              <button className="flex items-center gap-2 px-6 py-3 bg-blue-500 bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors text-white">
                <FaAmbulance className="text-blue-400" />
                <span className="font-medium vt323-regular text-xl">Request Ambulance</span>
              </button>
              <button
                onClick={fetchComplaints}
                className="flex items-center gap-2 px-6 py-3 bg-yellow-500 bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors text-white"
              >
                <FiUsers className="text-yellow-400" />
                <span className="font-medium vt323-regular text-xl">Refresh Complaints</span>
              </button>
            </div>
          </div>

          {/* Complaint Management */}
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 shadow-lg mb-12">
            <h2 className="text-3xl font-bold text-white mb-4 aclonica-regular">Complaint Management</h2>
            <p className="text-gray-200 mb-6 share-tech-mono-regular">View and manage all complaints from citizens</p>

            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type="text"
                  placeholder="Search complaints..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white bg-opacity-20 text-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-300"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 text-white">
                <FiFilter />
                <span className="vt323-regular text-xl">Filter</span>
              </button>
            </div>

            <div className="space-y-4">
              {loadingComplaints ? (
                <div className="text-center py-8">
                  <p className="text-white">Loading complaints from blockchain...</p>
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white">No complaints found on blockchain</p>
                  <button
                    onClick={fetchComplaints}
                    className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 vt323-regular text-xl"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                filteredComplaints.map((complaint) => (
                  <div key={complaint.id} className="bg-white bg-opacity-10 rounded-lg p-4 hover:bg-opacity-20 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-blue-500 bg-opacity-20 text-blue-400 rounded text-sm font-medium border border-blue-500">
                          Complaint #{complaint.id + 1}
                        </span>
                        {complaint.text.toLowerCase().includes('murder') && (
                          <span className="px-2 py-1 bg-red-500 bg-opacity-20 text-red-400 rounded text-sm font-medium border border-red-500">
                            Urgent
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-gray-200">
                        {complaint.text.length > 100
                          ? `${complaint.text.substring(0, 100)}...`
                          : complaint.text}
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          localStorage.setItem('callTranscript', complaint.text);
                          setShowFIRModal(true);
                        }}
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium vt323-regular text-lg"
                      >
                        View Details
                        <FiArrowRight />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Emergency Call Section */}
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 shadow-lg">
            <h2 className="text-3xl font-bold text-white mb-4 aclonica-regular">Emergency Call</h2>
            <div className="bg-white bg-opacity-10 rounded-lg p-4 hover:bg-opacity-20 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-red-500 bg-opacity-20 text-red-400 rounded text-sm font-medium border border-red-500">
                    Emergency Call
                  </span>
                  <span className={`px-2 py-1 ${style.bg} ${style.text} rounded text-sm font-medium border ${style.border}`}>
                    {style.label}
                  </span>
                </div>
              </div>
              <div className="mb-3">
                <p className="text-gray-200">{formattedTranscript}</p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowFIRModal(true)}
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium vt323-regular text-lg"
                >
                  {walletConnected ? 'File FIR' : 'Connect Wallet'}
                  <FiArrowRight />
                </button>
              </div>
            </div>
          </div>

          {/* FIR Filing Modal */}
          {showFIRModal && (
            <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
              <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 max-w-md w-full shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center aclonica-regular">
                    <FaFileAlt className="w-6 h-6 mr-2 text-blue-400" />
                    {walletConnected ? 'File FIR on Blockchain' : 'Connect Wallet'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowFIRModal(false);
                      setTransactionStatus('');
                    }}
                    className="text-gray-300 hover:text-white"
                    disabled={isProcessing}
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2 aclonica-regular">Call Transcript:</h3>
                  <div className="bg-white bg-opacity-10 p-4 rounded-lg max-h-60 overflow-y-auto">
                    <p className="text-gray-200 whitespace-pre-wrap">{savedTranscript}</p>
                  </div>
                </div>

                {transactionStatus && (
                  <div className={`mb-4 p-3 rounded-lg ${
                    transactionStatus.includes('Error') ? 'bg-red-500 bg-opacity-20 text-red-400' : 'bg-green-500 bg-opacity-20 text-green-400'
                  }`}>
                    {transactionStatus}
                  </div>
                )}

                <button
                  onClick={handleFileFIR}
                  disabled={isProcessing}
                  className="w-full bg-[#CBFF96] hover:bg-[#b2e67d] text-gray-900 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 vt323-regular text-xl"
                >
                  {isProcessing ? (
                    'Processing...'
                  ) : walletConnected ? (
                    'File FIR on Blockchain'
                  ) : (
                    'Connect Wallet & File FIR'
                  )}
                </button>

                {walletConnected && (
                  <p className="mt-4 text-sm text-gray-300">
                    This will permanently record the FIR on the blockchain. Transaction fees may apply.
                  </p>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;