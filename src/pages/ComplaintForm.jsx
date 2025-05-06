import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaVolumeUp, FaCar, FaExclamationTriangle, FaUserSlash, FaTrash, FaHome, FaUserSecret, FaBuilding, FaFire, FaFileAlt, FaCheck, FaUpload, FaTimes, FaExternalLinkAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';
import '../styles/ComplaintForm.css';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [complaintIpfsHash, setComplaintIpfsHash] = useState(null);
  const [evidenceIpfsHashes, setEvidenceIpfsHashes] = useState([]);
  const [showIpfsPopup, setShowIpfsPopup] = useState(false);
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

  // Function to upload files to IPFS via Pinata
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
        
        uploadedFiles.push({
          name: file.name,
          ipfsHash: response.data.IpfsHash,
          url: `https://ipfs.io/ipfs/${response.data.IpfsHash}`
        });
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        toast.error(`Failed to upload file ${file.name}`);
      }
    }
    
    return uploadedFiles;
  };

  // Function to upload complaint data to IPFS via Pinata
  const uploadComplaintToIPFS = async (fileHashes) => {
    const complaintData = {
      complaintType: getSelectedComplaintType(),
      description: description,
      location: location,
      evidence: {
        files: fileHashes,
        description: evidenceDescription
      },
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
      
      return response.data.IpfsHash;
    } catch (error) {
      console.error("Error uploading complaint data:", error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // First upload any evidence files to IPFS
      const uploadedFiles = await uploadFilesToIPFS();
      setEvidenceIpfsHashes(uploadedFiles);
      
      // Then upload the entire complaint data to IPFS
      const complaintHash = await uploadComplaintToIPFS(uploadedFiles);
      setComplaintIpfsHash(complaintHash);
      
      // Show success message
      toast.success("Complaint submitted successfully!", {
        duration: 4000,
        style: {
          background: '#CBFF96',
          color: '#1A1A1A',
        },
      });
      
      // Show the IPFS popup with hash information
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

  // Function to handle clicking on an IPFS hash link
  const openIPFSLink = (ipfsHash) => {
    window.open(`https://ipfs.io/ipfs/${ipfsHash}`, '_blank');
  };

  // Function to close the popup and navigate home
  const closePopupAndNavigate = () => {
    setShowIpfsPopup(false);
    navigate('/');
  };

  // IPFS Popup Component
  const IpfsPopup = () => {
    if (!showIpfsPopup) return null;
    
    return (
      <div className="ipfs-popup-overlay">
        <div className="ipfs-popup-content">
          <div className="ipfs-popup-header">
            <h2>Complaint Successfully Stored on IPFS</h2>
            <button className="close-button" onClick={closePopupAndNavigate}>
              <FaTimes />
            </button>
          </div>
          
          <div className="ipfs-popup-body">
            <div className="ipfs-section">
              <h3>FIR (Complete Complaint):</h3>
              <div className="ipfs-hash-container" onClick={() => openIPFSLink(complaintIpfsHash)}>
                <span className="ipfs-hash">{complaintIpfsHash}</span>
                <FaExternalLinkAlt className="external-link-icon" />
              </div>
              <p className="ipfs-description">Click on the hash to view your complete complaint details</p>
            </div>
            
            {evidenceIpfsHashes.length > 0 && (
              <div className="ipfs-section">
                <h3>Evidence Files:</h3>
                {evidenceIpfsHashes.map((file, index) => (
                  <div key={index} className="evidence-item">
                    <span className="evidence-name">{file.name}</span>
                    <div 
                      className="ipfs-hash-container" 
                      onClick={() => openIPFSLink(file.ipfsHash)}
                    >
                      <span className="ipfs-hash">{file.ipfsHash}</span>
                      <FaExternalLinkAlt className="external-link-icon" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="ipfs-notes">
              <p>Please save these IPFS hashes for your records. 
              They provide permanent access to your complaint data.</p>
            </div>
          </div>
          
          <div className="ipfs-popup-footer">
            <button className="primary-button" onClick={closePopupAndNavigate}>
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
          <div className="form-section">
            <h2>Step 1: Complaint Type</h2>
            <p>Select the type of complaint you want to register</p>

            <div className="complaint-types-grid">
              {complaintTypes.map((type) => (
                <div
                  key={type.id}
                  className={`complaint-type-card ${selectedType === type.id ? 'selected' : ''}`}
                  onClick={() => setSelectedType(type.id)}
                >
                  <div className="complaint-type-icon">{type.icon}</div>
                  <div className="complaint-type-label">{type.label}</div>
                </div>
              ))}
            </div>

            <div className="description-section">
              <h3>Brief Description</h3>
              <textarea
                placeholder="Please describe the issue in detail"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-buttons">
              <button className="cancel-button" onClick={() => navigate('/')}>
                Cancel
              </button>
              <button 
                className="next-button"
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
          <div className="form-section">
            <h2>Step 2: Location Details</h2>
            <p>Provide the location where the incident occurred</p>

            <div className="location-section">
              <h3>Address</h3>
              <div className="location-input-container">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Enter the location"
                  className="location-input"
                />
                {showSuggestions && location && (
                  <div className="location-suggestions">
                    {suggestions
                      .filter(suggestion => 
                        suggestion.toLowerCase().includes(location.toLowerCase())
                      )
                      .map((suggestion, index) => (
                        <div
                          key={index}
                          className="suggestion-item"
                          onClick={() => handleLocationSelect(suggestion)}
                        >
                          {suggestion}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-buttons">
              <button className="back-button" onClick={handleBack}>
                Back
              </button>
              <button 
                className="next-button"
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
          <div className="form-section">
            <h2>Step 3: Evidence Submission</h2>
            <p>Upload photos, videos, or audio recordings related to your complaint</p>

            <div className="evidence-section">
              <div 
                className="upload-area"
                onClick={() => fileInputRef.current?.click()}
              >
                <FaUpload className="upload-icon" />
                <p>Click to upload files</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  style={{ display: 'none' }}
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className="selected-files">
                  <h4>Selected Files:</h4>
                  <ul>
                    {selectedFiles.map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="evidence-description">
                <h3>Evidence Description</h3>
                <textarea
                  placeholder="Add any additional information about the evidence..."
                  value={evidenceDescription}
                  onChange={(e) => setEvidenceDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="form-buttons">
              <button className="back-button" onClick={handleBack}>
                Back
              </button>
              <button 
                className="next-button"
                onClick={handleNext}
              >
                Next
              </button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="form-section">
            <h2>Step 4: Contact Information</h2>
            <p>Provide your contact details so we can update you on your complaint</p>

            <div className="contact-section">
              <h3>Email Address</h3>
              <div className="email-input-container">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setShowEmailSuggestions(true);
                  }}
                  onFocus={() => setShowEmailSuggestions(true)}
                  placeholder="Enter your email address"
                  className="email-input"
                />
                {showEmailSuggestions && email && (
                  <div className="email-suggestions">
                    {emailSuggestions
                      .filter(suggestion => 
                        suggestion.toLowerCase().includes(email.toLowerCase())
                      )
                      .map((suggestion, index) => (
                        <div
                          key={index}
                          className="suggestion-item"
                          onClick={() => handleEmailSelect(suggestion)}
                        >
                          {suggestion}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-buttons">
              <button className="back-button" onClick={handleBack}>
                Back
              </button>
              <button 
                className="next-button"
                disabled={!email.trim()}
                onClick={handleNext}
              >
                Next
              </button>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="form-section">
            <h2>Step 5: Review & Submit</h2>
            <p>Please review your complaint details before submitting</p>

            <div className="review-section">
              <div className="review-item">
                <h3>Complaint Type</h3>
                <p className="review-value">{getSelectedComplaintType()}</p>
                <p className="review-description">{description}</p>
              </div>

              <div className="review-item">
                <h3>Location</h3>
                <p className="review-value">{location}</p>
              </div>

              <div className="review-item">
                <h3>Evidence</h3>
                <p className="review-value">
                  {selectedFiles.length > 0 
                    ? `${selectedFiles.length} file(s) selected for upload` 
                    : 'No files uploaded'}
                </p>
                <p className="review-description">
                  {evidenceDescription || 'No additional description provided'}
                </p>
              </div>

              <div className="review-item">
                <h3>Contact Information</h3>
                <p className="review-value">{email}</p>
              </div>

              <div className="ipfs-info">
                <p className="ipfs-notice">
                  Your complaint data will be stored securely on IPFS (InterPlanetary File System).
                </p>
              </div>
            </div>

            <div className="form-buttons">
              <button className="back-button" onClick={handleBack}>
                Back
              </button>
              <button 
                className={`submit-button ${isSubmitting ? 'submitting' : ''}`}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting to IPFS...' : 'Submit Complaint'}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="complaint-form-container">
      <h1>Register New Complaint</h1>
      <p className="subtitle">Please provide the details of your complaint. All information will be stored securely on IPFS.</p>

      <div className="progress-steps">
        <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          <div className="step-number">
            {currentStep > 1 ? <FaCheck className="check-icon" /> : '1'}
          </div>
          <div className="step-label">Type</div>
        </div>
        <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
          <div className="step-number">
            {currentStep > 2 ? <FaCheck className="check-icon" /> : '2'}
          </div>
          <div className="step-label">Location</div>
        </div>
        <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
          <div className="step-number">
            {currentStep > 3 ? <FaCheck className="check-icon" /> : '3'}
          </div>
          <div className="step-label">Evidence</div>
        </div>
        <div className={`step ${currentStep >= 4 ? 'active' : ''} ${currentStep > 4 ? 'completed' : ''}`}>
          <div className="step-number">
            {currentStep > 4 ? <FaCheck className="check-icon" /> : '4'}
          </div>
          <div className="step-label">Contact</div>
        </div>
        <div className={`step ${currentStep >= 5 ? 'active' : ''}`}>
          <div className="step-number">5</div>
          <div className="step-label">Review</div>
        </div>
      </div>

      {renderStep()}
      
      {/* IPFS Popup Dialog */}
      <IpfsPopup />
      
      {/* Add CSS for the popup */}
      <style jsx>{`
        .ipfs-popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .ipfs-popup-content {
          background-color: white;
          border-radius: 8px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        
        .ipfs-popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #eaeaea;
        }
        
        .ipfs-popup-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: #333;
        }
        
        .close-button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.2rem;
          color: #666;
        }
        
        .ipfs-popup-body {
          padding: 20px;
        }
        
        .ipfs-section {
          margin-bottom: 24px;
        }
        
        .ipfs-section h3 {
          margin-top: 0;
          margin-bottom: 12px;
          color: #333;
        }
        
        .ipfs-hash-container {
          display: flex;
          align-items: center;
          background-color: #f7f7f7;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 10px 12px;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-bottom: 8px;
        }
        
        .ipfs-hash-container:hover {
          background-color: #eaf7ff;
        }
        
        .ipfs-hash {
          font-family: monospace;
          flex-grow: 1;
          word-break: break-all;
        }
        
        .external-link-icon {
          margin-left: 10px;
          color: #0066cc;
        }
        
        .evidence-item {
          margin-bottom: 16px;
        }
        
        .evidence-name {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
        }
        
        .ipfs-description {
          font-size: 0.9rem;
          color: #666;
          margin-top: 4px;
        }
        
        .ipfs-notes {
          margin-top: 24px;
          padding: 12px;
          background-color: #fffde7;
          border-left: 4px solid #ffd600;
          border-radius: 4px;
        }
        
        .ipfs-notes p {
          margin: 0;
          font-size: 0.9rem;
        }
        
        .ipfs-popup-footer {
          padding: 16px 20px;
          border-top: 1px solid #eaeaea;
          text-align: right;
        }
        
        .primary-button {
          background-color: #b4fd6a;
          color: black;
          border: none;
          border-radius: 4px;
          padding: 10px 16px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        
        .primary-button:hover {
          background-color: #a5ff4b;
        }
      `}</style>
    </div>
  );
}

export default ComplaintForm;