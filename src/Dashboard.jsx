import { FiPhone, FiUsers, FiSearch, FiFilter, FiMapPin, FiArrowRight, FiX } from 'react-icons/fi';
import { FaAmbulance, FaFileAlt, FaCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import crypto from 'crypto-js';
import BG from "./assets/image.png";

// ComplaintRegistry contract details (from previous code)
const CONTRACT_ADDRESS = "0x5644104d12dBDB85b8e20dDCC723E11A6e261916"; // Replace with your deployed ComplaintRegistry address
const CONTRACT_ABI = [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "complaintId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "ipfsHash",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "complainant",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "ComplaintRegistered",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_ipfsHash",
				"type": "string"
			}
		],
		"name": "registerComplaint",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "complaintCount",
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
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "complaints",
		"outputs": [
			{
				"internalType": "string",
				"name": "ipfsHash",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "complainant",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_complaintId",
				"type": "uint256"
			}
		],
		"name": "getComplaint",
		"outputs": [
			{
				"internalType": "string",
				"name": "ipfsHash",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "complainant",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

function Dashboard() {
  const navigate = useNavigate();
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [secretKey, setSecretKey] = useState('');
  const [complaintDetails, setComplaintDetails] = useState(null);

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

  // Fetch complaints from the ComplaintRegistry contract
  const fetchComplaints = async () => {
    try {
      setLoadingComplaints(true);
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to view complaints');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const count = await contract.complaintCount();

      const complaintsArray = [];
      for (let i = 1; i <= count; i++) {
        const [ipfsHash, complainant, timestamp] = await contract.getComplaint(i);
        complaintsArray.push({
          id: i,
          ipfsHash,
          complainant,
          timestamp: new Date(Number(timestamp) * 1000).toLocaleString(),
        });
      }
      setComplaints(complaintsArray);
      setLoadingComplaints(false);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setLoadingComplaints(false);
      setTransactionStatus(`Error fetching complaints: ${error.message}`);
    }
  };

  // Fetch complaint details from IPFS
  const fetchComplaintDetails = async (encryptedHash, secret) => {
    try {
      // Decrypt the IPFS hash
      const decryptedHash = crypto.AES.decrypt(encryptedHash, secret).toString(crypto.enc.Utf8);
      if (!decryptedHash) {
        throw new Error('Invalid secret key');
      }

      // Fetch JSON data from IPFS
      const response = await axios.get(`https://ipfs.io/ipfs/${decryptedHash}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching complaint details from IPFS:', error);
      throw new Error(`Failed to fetch complaint details: ${error.message}`);
    }
  };

  // Handle viewing complaint details
  const handleViewDetails = async () => {
    if (!secretKey) {
      setTransactionStatus('Please enter the secret key');
      return;
    }

    setIsProcessing(true);
    try {
      const details = await fetchComplaintDetails(selectedComplaint.ipfsHash, secretKey);
      setComplaintDetails(details);
      setTransactionStatus('Complaint details loaded successfully!');
    } catch (error) {
      setTransactionStatus(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Setup event listeners for new complaints
  const setupEventListeners = async () => {
    if (!window.ethereum) return;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    contract.on("ComplaintRegistered", (complaintId, ipfsHash, complainant, timestamp) => {
      console.log(`New complaint registered: ID ${complaintId}, Hash ${ipfsHash}`);
      fetchComplaints();
    });

    return () => {
      contract.removeAllListeners("ComplaintRegistered");
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

  // Categorize based on keywords (for the saved transcript)
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

  const filteredComplaints = complaints.filter(complaint =>
    complaint.ipfsHash.toLowerCase().includes(searchQuery.toLowerCase())
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
                  Connected: {`${currentAccount?.substring(0, 6)}...${currentAccount?.substring(38)}`}
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
              {"Manage complaints, view details, and respond to emergencies".split("").map((char, index) => (
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
                {complaints.filter(c => c.ipfsHash.toLowerCase().includes('murder') || c.ipfsHash.toLowerCase().includes('accident') || c.ipfsHash.toLowerCase().includes('death')).length}
              </span>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-white mb-2 aclonica-regular">Total Complaints</h3>
              <span className="text-3xl font-bold text-white">{complaints.length}</span>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-white mb-2 aclonica-regular">Your Actions</h3>
              <span className="text-3xl font-bold text-white">
                {walletConnected ? complaints.filter(c => c.complainant.toLowerCase() === currentAccount?.toLowerCase()).length : 'N/A'}
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
                  placeholder="Search complaints by IPFS hash..."
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
                          Complaint #{complaint.id}
                        </span>
                        {complaint.ipfsHash.toLowerCase().includes('murder') && (
                          <span className="px-2 py-1 bg-red-500 bg-opacity-20 text-red-400 rounded text-sm font-medium border border-red-500">
                            Urgent
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-gray-200">
                        IPFS Hash: {complaint.ipfsHash.length > 50
                          ? `${complaint.ipfsHash.substring(0, 50)}...`
                          : complaint.ipfsHash}
                      </p>
                      <p className="text-gray-300 text-sm">Complainant: {complaint.complainant}</p>
                      <p className="text-gray-300 text-sm">Filed: {complaint.timestamp}</p>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedComplaint(complaint);
                          setShowDetailsModal(true);
                          setComplaintDetails(null);
                          setSecretKey('');
                          setTransactionStatus('');
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

          {/* Complaint Details Modal */}
          {showDetailsModal && (
            <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
              <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 max-w-lg w-full shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center aclonica-regular">
                    <FaFileAlt className="w-6 h-6 mr-2 text-blue-400" />
                    Complaint Details
                  </h2>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setTransactionStatus('');
                      setComplaintDetails(null);
                      setSecretKey('');
                    }}
                    className="text-gray-300 hover:text-white"
                    disabled={isProcessing}
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2 aclonica-regular">Enter Secret Key</h3>
                  <input
                    type="text"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="Enter the secret key to decrypt"
                    className="w-full px-4 py-3 bg-white bg-opacity-20 text-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-300"
                  />
                </div>

                {transactionStatus && (
                  <div className={`mb-4 p-3 rounded-lg ${
                    transactionStatus.includes('Error') || transactionStatus.includes('Please') ? 'bg-red-500 bg-opacity-20 text-red-400' : 'bg-green-500 bg-opacity-20 text-green-400'
                  }`}>
                    {transactionStatus}
                  </div>
                )}

                {complaintDetails ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Complaint Type</h3>
                      <p className="text-gray-200">{complaintDetails.complaintType}</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Description</h3>
                      <p className="text-gray-200">{complaintDetails.description}</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Location</h3>
                      <p className="text-gray-200">{complaintDetails.location}</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Evidence</h3>
                      {complaintDetails.evidence.files.length > 0 ? (
                        <ul className="text-gray-200">
                          {complaintDetails.evidence.files.map((file, index) => (
                            <li key={index}>
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline"
                              >
                                {file.name}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-200">No files uploaded</p>
                      )}
                      {complaintDetails.evidence.description && (
                        <p className="text-gray-200 mt-2">{complaintDetails.evidence.description}</p>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Witnesses</h3>
                      {complaintDetails.witnesses.length > 0 ? (
                        <ul className="text-gray-200 space-y-2">
                          {complaintDetails.witnesses.map((witness, index) => (
                            <li key={index}>
                              <p>Name: {witness.name}</p>
                              <p>Contact: {witness.contact}</p>
                              <p>Statement: {witness.statement}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-200">No witnesses provided</p>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Contact Info</h3>
                      <p className="text-gray-200">Email: {complaintDetails.contactInfo.email}</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Timestamp</h3>
                      <p className="text-gray-200">{complaintDetails.timestamp}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-200">Enter the secret key and click Load Details to view the complaint.</p>
                )}

                <button
                  onClick={handleViewDetails}
                  disabled={isProcessing || !secretKey}
                  className="w-full bg-[#CBFF96] hover:bg-[#b2e67d] text-gray-900 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 vt323-regular text-xl mt-4"
                >
                  {isProcessing ? 'Loading...' : 'Load Details'}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;