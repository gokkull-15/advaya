import { FiPhone, FiUsers, FiSearch, FiFilter, FiMapPin, FiArrowRight, FiX } from 'react-icons/fi';
import { FaAmbulance } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ethers } from 'ethers';

// Replace these with your actual contract details
const CONTRACT_ADDRESS = "0x305e4C065904b8acB380F69f9C1436504753CA64"; // Your deployed contract address
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
]; // Your contract ABI array

function Dashboard() {
  const navigate = useNavigate();
  const [showFIRModal, setShowFIRModal] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  
  // Get the saved transcript from localStorage
  const savedTranscript = localStorage.getItem('callTranscript') || 'No emergency calls recorded yet';

// Categorize based on keywords
let transcriptCategory = 'low'; // default
const lowerTranscript = savedTranscript.toLowerCase();

if (lowerTranscript.includes('murder') || lowerTranscript.includes('death') || lowerTranscript.includes('accident')) {
  transcriptCategory = 'critical';
} else if (lowerTranscript.includes('robbery') || lowerTranscript.includes('fight') || lowerTranscript.includes('theft')) {
  transcriptCategory = 'medium';
} else if (lowerTranscript.includes('problem') || lowerTranscript.includes('water problem') || lowerTranscript.includes('scarcity')) {
  transcriptCategory = 'low';
}

// Dynamic badge style and text
const categoryStyles = {
  critical: {
    bg: 'bg-red-100',
    text: 'text-red-500',
    border: 'border-red-200',
    label: 'Critical'
  },
  medium: {
    bg: 'bg-orange-100',
    text: 'text-orange-500',
    border: 'border-orange-200',
    label: 'Medium Priority'
  },
  low: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-500',
    border: 'border-yellow-200',
    label: 'Low Priority'
  }
};

const style = categoryStyles[transcriptCategory];

// Format the transcript for display
const formattedTranscript = savedTranscript.length > 100 
  ? `${savedTranscript.substring(0, 100)}...` 
  : savedTranscript;

  const handleFileFIR = async () => {
    try {
      setIsProcessing(true);
      
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to continue');
      }

      // Request account access if not already connected
      if (!walletConnected) {
        setTransactionStatus('Connecting wallet...');
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletConnected(true);
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      setTransactionStatus('Connecting to contract...');
      const firContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      setTransactionStatus('Saving FIR to blockchain...');
      const tx = await firContract.addComplaint(savedTranscript);
      
      setTransactionStatus('Waiting for transaction confirmation...');
      await tx.wait();
      
      setTransactionStatus('FIR successfully filed on blockchain!');
      setIsProcessing(false);
      
      // Close modal after 3 seconds
      setTimeout(() => {
        setShowFIRModal(false);
        setTransactionStatus('');
      }, 3000);
      
    } catch (error) {
      console.error('Error filing FIR:', error);
      setTransactionStatus(`Error: ${error.message}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900">Officer Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, Officer</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-red-50 rounded-lg p-6 border-2 border-red-200 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-red-600 font-medium">Urgent Tasks</h3>
              <span className="text-3xl font-bold text-red-600">4</span>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border-2 border-blue-200 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-600 font-medium">In Progress</h3>
              <span className="text-3xl font-bold text-gray-900">0</span>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border-2 border-green-200 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-600 font-medium">Resolved Today</h3>
              <span className="text-3xl font-bold text-gray-900">0</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg border-2 border-red-200 hover:bg-red-50 transition-colors">
              <FiPhone className="text-red-500" />
              <span className="font-medium">Emergency Services</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg border-2 border-blue-200 hover:bg-blue-50 transition-colors">
              <FaAmbulance className="text-blue-500" />
              <span className="font-medium">Request Ambulance</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg border-2 border-yellow-200 hover:bg-yellow-50 transition-colors">
              <FiUsers className="text-yellow-500" />
              <span className="font-medium">Request Backup</span>
            </button>
          </div>
        </div>

        {/* Task Management */}
        <div className="bg-white rounded-lg border-2 border-gray-300 shadow-md overflow-hidden">
          <div className="p-6 border-b-2 border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900">Task Management</h2>
            <p className="text-gray-600 mt-1">View and manage all assigned tasks</p>
          </div>

          <div className="p-6 border-b border-gray-200">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 rounded-lg hover:bg-gray-50">
                <FiFilter />
                <span>Filter</span>
              </button>
            </div>
          </div>

          <div className="px-6 pt-4 border-b border-gray-200">
            <div className="flex gap-4">
              <button className="px-4 py-2 text-red-500 border-b-2 border-red-500 font-medium">
                Urgent <span className="ml-1 bg-red-100 text-red-500 px-2 py-0.5 rounded-full text-sm">4</span>
              </button>
              <button className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium">In Progress</button>
              <button className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium">Resolved</button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2">
  <span className="px-2 py-1 bg-red-100 text-red-500 rounded text-sm font-medium border border-red-200">
    Emergency Call
  </span>
  <span className={`px-2 py-1 ${style.bg} ${style.text} rounded text-sm font-medium border ${style.border}`}>
    {style.label}
  </span>
</div>

              </div>
              <div className="mb-3">
                <p className="text-gray-900">
                  {formattedTranscript}
                </p>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={() => setShowFIRModal(true)}
                  className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium"
                >
                  View Details
                  <FiArrowRight />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FIR Filing Modal */}
      {showFIRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">File FIR</h2>
                <button 
                  onClick={() => {
                    setShowFIRModal(false);
                    setTransactionStatus('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={isProcessing}
                >
                  <FiX size={24} />
                </button>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Call Transcript:</h3>
                <div className="bg-gray-100 p-4 rounded-lg max-h-60 overflow-y-auto">
                  <p className="whitespace-pre-wrap">{savedTranscript}</p>
                </div>
              </div>
              
              {transactionStatus && (
                <div className={`mb-4 p-3 rounded-lg ${
                  transactionStatus.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {transactionStatus}
                </div>
              )}
              
              <button
                onClick={handleFileFIR}
                disabled={isProcessing}
                className="w-full bg-[#CBFF96] hover:bg-[#b2e67d] text-gray-900 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  'Processing...'
                ) : walletConnected ? (
                  'File FIR on Blockchain'
                ) : (
                  'Connect Wallet & File FIR'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;