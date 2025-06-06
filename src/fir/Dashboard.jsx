import { FiPhone, FiUsers, FiSearch, FiFilter, FiArrowRight, FiX } from 'react-icons/fi';
import { FaAmbulance, FaFileAlt, FaExternalLinkAlt } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import crypto from 'crypto-js';
import BG from './assets/image.png';

const isValidIPFSHash = (hash) => {
  return /^Qm[1-9A-Za-z]{44}$|^bafy[1-9A-Za-z]{55}$/.test(hash);
};

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [transactionStatus, setTransactionStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [secretKey, setSecretKey] = useState('');
  const [networkError, setNetworkError] = useState('');
  const [showFIRModal, setShowFIRModal] = useState(false);

  const savedTranscript = localStorage.getItem('callTranscript') || 'No emergency calls recorded yet';

  // Check if wallet is connected
  const checkWalletConnection = async () => {
    if (!window.ethereum) {
      setTransactionStatus('MetaMask is not installed. Please install MetaMask.');
      return false;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setCurrentAccount(accounts[0]);
        setWalletConnected(true);
        return true;
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      setTransactionStatus('Error checking wallet connection.');
    }
    return false;
  };

  // Fetch complaint data from IPFS with retry
  const fetchIPFSData = async (encryptedHash, secretKey, retries = 2) => {
    try {
      let decryptedHash = encryptedHash;
      if (secretKey) {
        console.log('Attempting to decrypt hash:', encryptedHash, 'with key:', secretKey);
        decryptedHash = crypto.AES.decrypt(encryptedHash, secretKey).toString(crypto.enc.Utf8);
        console.log('Decrypted IPFS hash:', decryptedHash);
      }
      if (!isValidIPFSHash(decryptedHash)) {
        console.error('Invalid IPFS hash:', decryptedHash);
        return { error: `Invalid IPFS hash: ${decryptedHash}` };
      }
      console.log('Fetching IPFS data from:', `https://gateway.pinata.cloud/ipfs/${decryptedHash}`);
      const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${decryptedHash}`, {
        timeout: 15000,
      });
      console.log('IPFS data fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching IPFS data for hash ${encryptedHash}:`, error.message);
      if (retries > 0) {
        console.log(`Retrying IPFS fetch (${retries} attempts left)...`);
        return fetchIPFSData(encryptedHash, secretKey, retries - 1);
      }
      return { error: `Failed to fetch complaint data from IPFS: ${error.message}` };
    }
  };

  // Fetch complaints from local state
  const fetchComplaints = async () => {
    try {
      setLoadingComplaints(true);
      setTransactionStatus('');
      
      // Since we're not using blockchain, we'll just load complaints from state
      // If there are any complaints in location.state, we'll process them
      const complaintsArray = [...complaints];
      setComplaints(complaintsArray);
      console.log('Complaints fetched:', complaintsArray);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setTransactionStatus(`Error fetching complaints: ${error.message}`);
    } finally {
      setLoadingComplaints(false);
    }
  };

  // Handle new complaint from location state
  const handleNewComplaint = async () => {
    const { complaintIpfsHash, evidenceIpfsHashes, secretKey, originalHash } = location.state || {};
    if (complaintIpfsHash) {
      try {
        console.log('Processing new complaint from location state:', { complaintIpfsHash, secretKey, originalHash });
        const complaintData = await fetchIPFSData(complaintIpfsHash, secretKey);
        const newComplaint = {
          id: complaints.length,
          encryptedHash: complaintIpfsHash,
          data: complaintData,
          timestamp: complaintData?.timestamp || new Date().toISOString(),
          secretKey,
        };
        setComplaints(prev => [newComplaint, ...prev]);
        console.log('Added new complaint from location state:', newComplaint);
      } catch (error) {
        console.error('Error processing new complaint:', error);
        setTransactionStatus(`Error processing new complaint: ${error.message}`);
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      await checkWalletConnection();
      await fetchComplaints();
      await handleNewComplaint();
    };
    init();
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
      label: 'Critical',
    },
    medium: {
      bg: 'bg-orange-500 bg-opacity-20',
      text: 'text-orange-400',
      border: 'border-orange-500',
      label: 'Medium Priority',
    },
    low: {
      bg: 'bg-yellow-500 bg-opacity-20',
      text: 'text-yellow-400',
      border: 'border-yellow-500',
      label: 'Low Priority',
    },
  };

  const style = categoryStyles[transcriptCategory];
  const formattedTranscript =
    savedTranscript.length > 100 ? `${savedTranscript.substring(0, 100)}...` : savedTranscript;

  const handleFileFIR = async () => {
    try {
      setIsProcessing(true);
      setTransactionStatus('');
      if (!window.ethereum) throw new Error('MetaMask not installed');

      if (!walletConnected) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setCurrentAccount(accounts[0]);
        setWalletConnected(true);
      }

      const complaintData = {
        complaintType: 'Emergency',
        description: savedTranscript,
        location: 'Unknown',
        timestamp: new Date().toISOString(),
        witnesses: [],
        evidence: { files: [], description: '' },
        contactInfo: { email: 'officer@example.com' },
        secretKey: crypto.lib.WordArray.random(16).toString(),
      };
      const response = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', complaintData, {
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: 'd691d2f9fc0680b10b50',
          pinata_secret_api_key: '7c19a36044c1b10155991e249ddd642f685ca5747f30850019710dd25a7f63de',
        },
      });
      const ipfsHash = response.data.IpfsHash;
      const secretKey = complaintData.secretKey;
      const encryptedHash = crypto.AES.encrypt(ipfsHash, secretKey).toString();

      console.log('Filing FIR with IPFS hash:', encryptedHash);

      // Add to local state instead of blockchain
      const newComplaint = {
        id: complaints.length,
        encryptedHash,
        data: complaintData,
        timestamp: complaintData.timestamp,
        secretKey,
      };
      setComplaints(prev => [newComplaint, ...prev]);

      setTransactionStatus('FIR successfully filed to IPFS!');
    } catch (error) {
      console.error('Error filing FIR:', error);
      setTransactionStatus(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const decryptIpfsHash = (encryptedHash, key) => {
    try {
      const decrypted = crypto.AES.decrypt(encryptedHash, key).toString(crypto.enc.Utf8);
      console.log('Decrypted hash:', decrypted);
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  };

  const openIPFSLink = async (encryptedHash, key) => {
    const decryptedHash = decryptIpfsHash(encryptedHash, key);
    if (decryptedHash && isValidIPFSHash(decryptedHash)) {
      console.log('Opening IPFS link:', `https://gateway.pinata.cloud/ipfs/${decryptedHash}`);
      window.open(`https://gateway.pinata.cloud/ipfs/${decryptedHash}`, '_blank');
    } else {
      setTransactionStatus('Invalid secret key or corrupted data. Please enter the correct secret key.');
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    const searchLower = searchQuery.toLowerCase();
    return (
      complaint.data &&
      (complaint.data.complaintType?.toLowerCase().includes(searchLower) ||
        complaint.data.description?.toLowerCase().includes(searchLower) ||
        complaint.data.location?.toLowerCase().includes(searchLower) ||
        complaint.encryptedHash?.toLowerCase().includes(searchLower))
    );
  });

  const ComplaintDetailsModal = () => {
    if (!selectedComplaint) return null;

    const handleTryFetchWithKey = async () => {
      if (!secretKey) {
        setTransactionStatus('Please enter a secret key.');
        return;
      }
      const newData = await fetchIPFSData(selectedComplaint.encryptedHash, secretKey);
      if (!newData.error) {
        setComplaints(prev =>
          prev.map(c =>
            c.id === selectedComplaint.id
              ? { ...c, data: newData, secretKey }
              : c
          )
        );
        setSelectedComplaint({ ...selectedComplaint, data: newData, secretKey });
        setTransactionStatus('Complaint data fetched successfully!');
      } else {
        setTransactionStatus('Failed to fetch data with provided key.');
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center aclonica-regular">
              <FaFileAlt className="w-6 h-6 mr-2 text-blue-400" />
              Complaint Details
            </h2>
            <button
              onClick={() => {
                setSelectedComplaint(null);
                setSecretKey('');
                setTransactionStatus('');
              }}
              className="text-gray-300 hover:text-white"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">IPFS Hash</h3>
              <div
                className="p-3 bg-gray-100 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => openIPFSLink(selectedComplaint.encryptedHash, secretKey || selectedComplaint.secretKey)}
              >
                <span className="text-sm font-mono break-all">{selectedComplaint.encryptedHash}</span>
                <FaExternalLinkAlt className="text-blue-600 ml-2" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Secret Key</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={secretKey || selectedComplaint.secretKey || ''}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter secret key to decrypt"
                  className="flex-1 px-4 py-3 bg-white bg-opacity-20 text-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-300"
                />
                <button
                  onClick={handleTryFetchWithKey}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Try Key
                </button>
              </div>
            </div>

            {selectedComplaint.data && !selectedComplaint.data.error ? (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Complaint Type</h3>
                  <p className="text-gray-200">{selectedComplaint.data.complaintType || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                  <p className="text-gray-200">{selectedComplaint.data.description || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Location</h3>
                  <p className="text-gray-200">{selectedComplaint.data.location || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Witnesses</h3>
                  {selectedComplaint.data.witnesses?.length > 0 ? (
                    selectedComplaint.data.witnesses.map((witness, index) => (
                      <div key={index} className="mb-2 p-3 bg-gray-700 bg-opacity-50 rounded-lg">
                        <p className="text-gray-200 font-medium">Witness {index + 1}: {witness.name}</p>
                        <p className="text-gray-300">Contact: {witness.contact}</p>
                        <p className="text-gray-300">Statement: {witness.statement}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-200">No witnesses</p>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Evidence</h3>
                  {selectedComplaint.data.evidence?.files?.length > 0 ? (
                    selectedComplaint.data.evidence.files.map((file, index) => (
                      <div key={index} className="mb-2 p-3 bg-gray-700 bg-opacity-50 rounded-lg">
                        <p className="text-gray-200 font-medium">{file.name}</p>
                        <div
                          className="p-2 bg-gray-100 rounded flex justify-between items-center cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => openIPFSLink(file.ipfsHash, file.secretKey || secretKey || selectedComplaint.secretKey)}
                        >
                          <span className="text-xs font-mono break-all">{file.ipfsHash}</span>
                          <FaExternalLinkAlt className="text-blue-600 ml-2" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-200">No evidence files</p>
                  )}
                  {selectedComplaint.data.evidence?.description && (
                    <p className="text-gray-200 mt-2">{selectedComplaint.data.evidence.description}</p>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Contact Information</h3>
                  <p className="text-gray-200">{selectedComplaint.data.contactInfo?.email || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Timestamp</h3>
                  <p className="text-gray-200">
                    {new Date(selectedComplaint.data.timestamp).toLocaleString() || 'N/A'}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-red-400">
                {selectedComplaint.data?.error || 'No data available for this complaint. Try entering the secret key.'}
              </p>
            )}
          </div>

          {transactionStatus && (
            <div
              className={`mb-4 p-3 rounded-lg ${
                transactionStatus.includes('Error') || transactionStatus.includes('Invalid')
                  ? 'bg-red-500 bg-opacity-20 text-red-400'
                  : 'bg-green-500 bg-opacity-20 text-green-400'
              }`}
            >
              {transactionStatus}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed" style={{ backgroundImage: `url(${BG})` }}>
      <div className="bg-black bg-opacity-60 min-h-screen">
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
              {Array.from('Manage complaints, file FIRs, and respond to emergencies').map((char, index) => (
                <span key={index} style={{ '--i': index }}>
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
              
            </p>
          </div>

          {networkError && (
            <div className="mb-12 p-4 bg-red-500 bg-opacity-20 text-red-400 rounded-lg">{networkError}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-red-400 mb-2 aclonica-regular">Urgent Tasks</h3>
              <span className="text-3xl font-bold text-white">
                {complaints.filter(
                  c =>
                    c.data &&
                    !c.data.error &&
                    (c.data.complaintType?.toLowerCase().includes('fire') ||
                      c.data.description?.toLowerCase().includes('accident') ||
                      c.data.description?.toLowerCase().includes('death'))
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
                {walletConnected ? complaints.filter(c => c.data && c.user === currentAccount).length : 'N/A'}
              </span>
            </div>
          </div>

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

          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 shadow-lg mb-12">
            <h2 className="text-3xl font-bold text-white mb-4 aclonica-regular">Complaint Management</h2>
            <p className="text-gray-200 mb-6 share-tech-mono-regular">
              View and manage all complaints from citizens
            </p>

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
                  <p className="text-white">Loading complaints...</p>
                </div>
              ) : complaints.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white">No complaints found</p>
                  <button
                    onClick={fetchComplaints}
                    className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 vt323-regular text-xl"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white">No complaints match your search</p>
                </div>
              ) : (
                filteredComplaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    className="bg-white bg-opacity-10 rounded-lg p-4 hover:bg-opacity-20 transition-colors cursor-pointer"
                    onClick={() => setSelectedComplaint(complaint)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-blue-500 bg-opacity-20 text-blue-400 rounded text-sm font-medium border border-blue-500">
                          Complaint #{complaint.id + 1}
                        </span>
                        {complaint.data &&
                          !complaint.data.error &&
                          (complaint.data.complaintType?.toLowerCase().includes('fire') ||
                            complaint.data.description?.toLowerCase().includes('accident')) && (
                            <span className="px-2 py-1 bg-red-500 bg-opacity-20 text-red-400 rounded text-sm font-medium border border-red-500">
                              Urgent
                            </span>
                          )}
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-gray-200">
                        {complaint.data && !complaint.data.error
                          ? `${complaint.data.complaintType || 'Unknown'}: ${
                              complaint.data.description?.length > 100
                                ? complaint.data.description.substring(0, 100) + '...'
                                : complaint.data.description || 'N/A'
                            }`
                          : complaint.data?.error || 'Unable to load complaint details. Click to enter secret key.'}
                      </p>
                      {complaint.data && !complaint.data.error && complaint.data.timestamp && (
                        <p className="text-gray-400 text-sm mt-1">
                          Filed on: {new Date(complaint.data.timestamp).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

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

                <h2 className='text-green-600 mt-4'>{transactionStatus}{``}</h2>

                {walletConnected && (
                  <p className="mt-4 text-sm text-gray-300">
                    This will permanently record the FIR on the blockchain. Transaction fees may apply.
                  </p>
                )}
              </div>
            </div>
          )}

          <ComplaintDetailsModal />
        </main>
      </div>
    </div>
  );
}

export default Dashboard;