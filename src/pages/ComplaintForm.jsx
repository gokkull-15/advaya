import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaVolumeUp, FaCar, FaExclamationTriangle, FaUserSlash, FaTrash, FaHome, FaUserSecret, FaBuilding, FaFire, FaFileAlt, FaCheck, FaUpload, FaTimes, FaExternalLinkAlt, FaUsers, FaSearch } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import crypto from 'crypto-js';
import BG from "../assets/image.png";

function ComplaintForm() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [email, setEmail] = useState('');
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [witnessDetails, setWitnessDetails] = useState([{ name: '', contact: '', statement: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [complaintIpfsHash, setComplaintIpfsHash] = useState(null);
  const [evidenceIpfsHashes, setEvidenceIpfsHashes] = useState([]);
  const [showIpfsPopup, setShowIpfsPopup] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const fileInputRef = useRef(null);

  // Pinata configuration
  const pinataApiKey = "f1eed63bf925da74438e";
  const pinataApiSecret = "2a4df1e27d2cf930e707956ba0def1721c398318197317bcf7593bb8c935a811";
  const pinataEndpoint = "https://api.pinata.cloud/pinning/pinFileToIPFS";
  const pinataJSONEndpoint = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

  const suggestions = [
    'No.36, south alley, chennai',
    'No.36, south alley, coimbatore'
  ];

  const emailSuggestions = [
    'sairam1203mr@gmail.com',
    'philosanjaychamberline.26c@gmail.com',
    'asd@ad.com'
  ];

  const complaintTypes = [
    { id: 'noise', icon: <FaVolumeUp />, label: 'Noise Complaint' },
    { id: 'traffic', icon: <FaCar />, label: 'Traffic Violation' },
    { id: 'suspicious', icon: <FaExclamationTriangle />, label: 'Suspicious Activity' },
    { id: 'harassment', icon: <FaUserSlash />, label: 'Harassment' },
    { id: 'vandalism', icon: <FaTrash />, label: 'Vandalism' },
    { id: 'domestic', icon: <FaHome />, label: 'Domestic Dispute' },
    { id: 'theft', icon: <FaUserSecret />, label: 'Theft' },
    { id: 'fraud', icon: <FaBuilding />, label: 'Fraud' },
    { id: 'fire', icon: <FaFire />, label: 'Fire Emergency' },
    { id: 'other', icon: <FaFileAlt />, label: 'Other' },
  ];

  // Generate a random secret key for officer access
  const generateSecretKey = () => {
    return crypto.lib.WordArray.random(16).toString();
  };

  // Encrypt IPFS hash with secret key
  const encryptIpfsHash = (hash, secret) => {
    return crypto.AES.encrypt(hash, secret).toString();
  };

  // Handle witness details change
  const handleWitnessChange = (index, field, value) => {
    const newWitnesses = [...witnessDetails];
    newWitnesses[index][field] = value;
    setWitnessDetails(newWitnesses);
  };

  // Add new witness form
  const addWitness = () => {
    setWitnessDetails([...witnessDetails, { name: '', contact: '', statement: '' }]);
  };

  // Remove witness
  const removeWitness = (index) => {
    setWitnessDetails(witnessDetails.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleLocationSelect = (suggestion) => {
    setLocation(suggestion);
    setShowSuggestions(false);
  };

  const handleEmailSelect = (suggestion) => {
    setEmail(suggestion);
    setShowEmailSuggestions(false);
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  const uploadFilesToIPFS = async () => {
    if (selectedFiles.length === 0) {
      return [];
    }

    const uploadedFiles = [];
    
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("file", file);
      
      try {
        const response = await axios.post(pinataEndpoint, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            pinata_api_key: pinataApiKey,
            pinata_secret_api_key: pinataApiSecret,
          },
        });
        
        const ipfsHash = response.data.IpfsHash;
        uploadedFiles.push({
          name: file.name,
          ipfsHash: encryptIpfsHash(ipfsHash, generateSecretKey()), // Encrypt evidence file hashes
          url: `https://ipfs.io/ipfs/${ipfsHash}`
        });
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        toast.error(`Failed to upload file ${file.name}`);
      }
    }
    
    return uploadedFiles;
  };

  const uploadComplaintToIPFS = async (fileHashes) => {
    const newSecretKey = generateSecretKey();
    setSecretKey(newSecretKey);

    const complaintData = {
      complaintType: getSelectedComplaintType(),
      description: description,
      location: location,
      evidence: {
        files: fileHashes,
        description: evidenceDescription
      },
      witnesses: witnessDetails,
      contactInfo: {
        email: email
      },
      timestamp: new Date().toISOString()
    };

    try {
      const response = await axios.post(pinataJSONEndpoint, 
        complaintData,
        {
          headers: {
            "Content-Type": "application/json",
            pinata_api_key: pinataApiKey,
            pinata_secret_api_key: pinataApiSecret,
          },
        }
      );
      
      // Encrypt the IPFS hash
      const encryptedHash = encryptIpfsHash(response.data.IpfsHash, newSecretKey);
      return { originalHash: response.data.IpfsHash, encryptedHash };
    } catch (error) {
      console.error("Error uploading complaint data:", error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const uploadedFiles = await uploadFilesToIPFS();
      setEvidenceIpfsHashes(uploadedFiles);
      
      const { originalHash, encryptedHash } = await uploadComplaintToIPFS(uploadedFiles);
      setComplaintIpfsHash(encryptedHash);
      
      toast.success("Complaint submitted successfully!", {
        duration: 4000,
        style: {
          background: '#CBFF96',
          color: '#1A1A1A',
        },
      });
      
      setShowIpfsPopup(true);
      
    } catch (error) {
      console.error("Error submitting complaint:", error);
      toast.error("Failed to submit complaint. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedComplaintType = () => {
    const selected = complaintTypes.find(type => type.id === selectedType);
    return selected ? selected.label : '';
  };

  const openIPFSLink = (encryptedHash) => {
    try {
      const decryptedHash = crypto.AES.decrypt(encryptedHash, secretKey).toString(crypto.enc.Utf8);
      window.open(`https://ipfs.io/ipfs/${decryptedHash}`, '_blank');
    } catch (error) {
      toast.error("Invalid secret key or corrupted data");
    }
  };

  const closePopupAndNavigate = () => {
    setShowIpfsPopup(false);
    navigate('/');
  };

  const IpfsPopup = () => {
    if (!showIpfsPopup) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <FaFileAlt className="w-6 h-6 mr-2 text-blue-600" />
              Complaint Stored on IPFS
            </h2>
            <button 
              onClick={closePopupAndNavigate}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Secret Key for Officers</h3>
              <div className="p-3 bg-gray-100 rounded-lg">
                <span className="text-sm font-mono break-all">{secretKey}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Please save this secret key. Officers will need it to access the complaint data.</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">FIR (Complete Complaint):</h3>
              <div 
                className="p-3 bg-gray-100 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => openIPFSLink(complaintIpfsHash)}
              >
                <span className="text-sm font-mono break-all">{complaintIpfsHash}</span>
                <FaExternalLinkAlt className="text-blue-600 ml-2" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Click to view your complete complaint details (requires secret key)</p>
            </div>
            
            {evidenceIpfsHashes.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Evidence Files:</h3>
                <div className="space-y-2">
                  {evidenceIpfsHashes.map((file, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm font-medium block mb-1">{file.name}</span>
                      <div 
                        className="p-2 bg-gray-100 rounded flex justify-between items-center cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => openIPFSLink(file.ipfsHash)}
                      >
                        <span className="text-xs font-mono break-all">{file.ipfsHash}</span>
                        <FaExternalLinkAlt className="text-blue-600 ml-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r">
              <p className="text-sm text-gray-700">
                Please save these IPFS hashes and the secret key for your records. They provide permanent access to your complaint data.
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={closePopupAndNavigate}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all duration-300"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-2 aclonica-regular">Step 1: Complaint Type</h2>
            <p className="text-gray-200 mb-6">Select the type of complaint you want to register</p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {complaintTypes.map((type) => (
                <button
                  key={type.id}
                  className={`p-4 rounded-xl transition-all duration-300 flex flex-col items-center justify-center ${selectedType === type.id ? 'bg-purple-600 text-white' : 'bg-white bg-opacity-20 text-gray-200 hover:bg-opacity-30'}`}
                  onClick={() => setSelectedType(type.id)}
                >
                  <span className="text-xl mb-2">{type.icon}</span>
                  <span className="text-sm font-medium cinzel-uniquifier">{type.label}</span>
                </button>
              ))}
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-2 aclonica-regular">Brief Description</h3>
              <textarea
                className="w-full px-4 py-3 bg-white bg-opacity-20 text-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-300"
                placeholder="Please describe the issue in detail"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
            </div>

            <div className="flex justify-between">
              <button 
                onClick={() => navigate('/')}
                className="px-6 py-2 bg-gray-600 vt323-regular text-2xl hover:bg-gray-700 text-white rounded-full font-semibold transition-all duration-300"
              >
                Cancel
              </button>
              <button 
                className={`px-6 py-2 rounded-full font-semibold vt323-regular text-2xl transition-all duration-300 ${!selectedType || !description.trim() ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                disabled={!selectedType || !description.trim()}
                onClick={handleNext}
              >
                Next
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-2 aclonica-regular">Step 2: Location Details</h2>
            <p className="text-gray-200 mb-6">Provide the location where the incident occurred</p>

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-2 aclonica-regular">Address</h3>
              <div className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Enter the location"
                  className="w-full px-4 py-3 bg-white bg-opacity-20 text-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-300"
                />
                {showSuggestions && location && (
                  <div className="absolute z-10 mt-1 w-full bg-gray-800 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {suggestions
                      .filter(suggestion => 
                        suggestion.toLowerCase().includes(location.toLowerCase())
                      )
                      .map((suggestion, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-gray-700 cursor-pointer text-gray-200"
                          onClick={() => handleLocationSelect(suggestion)}
                        >
                          {suggestion}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <button 
                onClick={handleBack}
                className="px-6 py-2 bg-gray-600 vt323-regular text-2xl hover:bg-gray-700 text-white rounded-full font-semibold transition-all duration-300"
              >
                Back
              </button>
              <button 
                className={`px-6 py-2 vt323-regular text-2xl rounded-full font-semibold transition-all duration-300 ${!location.trim() ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                disabled={!location.trim()}
                onClick={handleNext}
              >
                Next
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-2 aclonica-regular">Step 3: Witness Details</h2>
            <p className="text-gray-200 mb-6">Provide details of any witnesses to the incident</p>

            <div className="mb-8">
              {witnessDetails.map((witness, index) => (
                <div key={index} className="bg-white bg-opacity-10 rounded-lg p-4 mb-4">
                  <h4 className="text-lg font-semibold text-white mb-2">Witness {index + 1}</h4>
                  <input
                    type="text"
                    placeholder="Witness Name"
                    value={witness.name}
                    onChange={(e) => handleWitnessChange(index, 'name', e.target.value)}
                    className="w-full px-4 py-3 bg-white bg-opacity-20 text-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-300 mb-3"
                  />
                  <input
                    type="text"
                    placeholder="Contact Information"
                    value={witness.contact}
                    onChange={(e) => handleWitnessChange(index, 'contact', e.target.value)}
                    className="w-full px-4 py-3 bg-white bg-opacity-20 text-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-300 mb-3"
                  />
                  <textarea
                    placeholder="Witness Statement"
                    value={witness.statement}
                    onChange={(e) => handleWitnessChange(index, 'statement', e.target.value)}
                    className="w-full px-4 py-3 bg-white bg-opacity-20 text-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-300"
                    rows={3}
                  />
                  {index > 0 && (
                    <button 
                      className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all duration-300"
                      onClick={() => removeWitness(index)}
                    >
                      Remove Witness
                    </button>
                  )}
                </div>
              ))}
              <button 
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all duration-300"
                onClick={addWitness}
              >
                Add Another Witness
              </button>
            </div>

            <div className="flex justify-between">
              <button 
                onClick={handleBack}
                className="px-6 py-2 bg-gray-600 vt323-regular text-2xl hover:bg-gray-700 text-white rounded-full font-semibold transition-all duration-300"
              >
                Back
              </button>
              <button 
                className="px-6 py-2 vt323-regular text-2xl bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-all duration-300"
                onClick={handleNext}
              >
                Next
              </button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-2 aclonica-regular">Step 4: Evidence Submission</h2>
            <p className="text-gray-200 mb-6">Upload photos, videos, or audio recordings related to your complaint</p>

            <div className="mb-8">
              <div 
                className="border-2 border-dashed border-gray-400 rounded-xl p-8 text-center cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <FaUpload className="mx-auto text-3xl text-gray-300 mb-3" />
                <p className="text-gray-300">Click to upload files</p>
                <p className="text-sm text-gray-400 mt-1">Supports images, videos, and audio files</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  style={{ display: 'none' }}
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-4 bg-white bg-opacity-10 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-2">Selected Files:</h4>
                  <ul className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <li key={index} className="text-gray-200 flex items-center">
                        <span className="truncate flex-1">{file.name}</span>
                        <span className="text-xs bg-gray-700 px-2 py-1 rounded ml-2">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-2 aclonica-regular">Evidence Description</h3>
                <textarea
                  className="w-full px-4 py-3 bg-white bg-opacity-20 text-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-300"
                  placeholder="Add any additional information about the evidence..."
                  value={evidenceDescription}
                  onChange={(e) => setEvidenceDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <button 
                onClick={handleBack}
                className="px-6 py-2 vt323-regular text-2xl bg-gray-600 hover:bg-gray-700 text-white rounded-full font-semibold transition-all duration-300"
              >
                Back
              </button>
              <button 
                onClick={handleNext}
                className="px-6 py-2 vt323-regular text-2xl bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-all duration-300"
              >
                Next
              </button>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-2 aclonica-regular">Step 5: Contact Information</h2>
            <p className="text-gray-200 mb-6">Provide your contact details so we can update you on your complaint</p>

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-2 aclonica-regular">Email Address</h3>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setShowEmailSuggestions(true);
                  }}
                  onFocus={() => setShowEmailSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowEmailSuggestions(false), 200)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 bg-white bg-opacity-20 text-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-300"
                />
                {showEmailSuggestions && email && (
                  <div className="absolute z-10 mt-1 w-full bg-gray-800 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {emailSuggestions
                      .filter(suggestion => 
                        suggestion.toLowerCase().includes(email.toLowerCase())
                      )
                      .map((suggestion, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-gray-700 cursor-pointer text-gray-200"
                          onClick={() => handleEmailSelect(suggestion)}
                        >
                          {suggestion}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <button 
                onClick={handleBack}
                className="px-6 py-2 vt323-regular text-2xl bg-gray-600 hover:bg-gray-700 text-white rounded-full font-semibold transition-all duration-300"
              >
                Back
              </button>
              <button 
                className={`px-6 py-2 vt323-regular text-2xl rounded-full font-semibold transition-all duration-300 ${!email.trim() ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                disabled={!email.trim()}
                onClick={handleNext}
              >
                Next
              </button>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-2 aclonica-regular">Step 6: Review & Submit</h2>
            <p className="text-gray-200 mb-6">Please review your complaint details before submitting</p>

            <div className="mb-8 space-y-6">
              <div className="bg-white bg-opacity-10 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Complaint Type</h3>
                <p className="text-gray-200 font-medium">{getSelectedComplaintType()}</p>
                <p className="text-gray-300 mt-2">{description}</p>
              </div>

              <div className="bg-white bg-opacity-10 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Location</h3>
                <p className="text-gray-200">{location}</p>
              </div>

              <div className="bg-white bg-opacity-10 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Witnesses</h3>
                {witnessDetails.map((witness, index) => (
                  <div key={index} className="mb-3 p-3 bg-gray-700 bg-opacity-50 rounded-lg">
                    <p className="text-gray-200 font-medium">Witness {index + 1}: {witness.name}</p>
                    <p className="text-gray-300">Contact: {witness.contact}</p>
                    <p className="text-gray-300">Statement: {witness.statement}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white bg-opacity-10 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Evidence</h3>
                <p className="text-gray-200 font-medium">
                  {selectedFiles.length > 0 
                    ? `${selectedFiles.length} file(s) selected` 
                    : 'No files uploaded'}
                </p>
                {evidenceDescription && (
                  <p className="text-gray-300 mt-2">{evidenceDescription}</p>
                )}
              </div>

              <div className="bg-white bg-opacity-10 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Contact Information</h3>
                <p className="text-gray-200">{email}</p>
              </div>

              <div className="bg-yellow-500 bg-opacity-20 rounded-xl p-4 border-l-4 border-yellow-400">
                <p className="text-yellow-100">
                  Your complaint data will be stored securely on IPFS with encrypted access for authorized officers.
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <button 
                onClick={handleBack}
                className="px-6 py-2 vt323-regular text-2xl bg-gray-600 hover:bg-gray-700 text-white rounded-full font-semibold transition-all duration-300"
              >
                Back
              </button>
              <button 
                className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 flex items-center ${isSubmitting ? 'bg-purple-600' : 'bg-green-600 hover:bg-green-700'} text-white`}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="vt323-regular text-2xl opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : <span className='vt323-regular text-2xl'>Submit Complaint</span>}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
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
              <FaHome className="w-5 h-5 mr-2" />
              Home
            </button>
            <button 
              onClick={() => navigate('/track-complaint')}
              className="px-4 py-2 rounded-full bg-white hover:bg-gray-200 text-black font-['Roboto'] text-lg font-semibold transition-all duration-300 shadow-md flex items-center"
            >
              <FaSearch className="w-5 h-5 mr-2" />
              Track Complaint
            </button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-1">
          <div className="text-center mb-6">
            <h1 className="text-5xl font-bold text-white mb-4 aclonica-regular">Register New Complaint</h1>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto share-tech-mono-regular">
              Please provide the details of your complaint. All information will be stored securely.
            </p>
          </div>

          <div className="flex justify-center mb-8">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <React.Fragment key={step}>
                  <div className={`flex flex-col items-center ${currentStep >= step ? 'text-white' : 'text-gray-400'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= step ? 'bg-purple-600' : 'bg-gray-700'} ${currentStep === step ? 'ring-2 ring-purple-400' : ''}`}>
                      {currentStep > step ? <FaCheck className="text-white" /> : step}
                    </div>
                    <span className="text-xs mt-1">
                      {step === 1 && 'Type'}
                      {step === 2 && 'Location'}
                      {step === 3 && 'Witnesses'}
                      {step === 4 && 'Evidence'}
                      {step === 5 && 'Contact'}
                      {step === 6 && 'Review'}
                    </span>
                  </div>
                  {step < 6 && (
                    <div className={`w-16 h-1 mx-2 ${currentStep > step ? 'bg-purple-600' : 'bg-gray-700'}`}></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {renderStep()}
          
          <IpfsPopup />
        </main>
      </div>
    </div>
  );
}

export default ComplaintForm;