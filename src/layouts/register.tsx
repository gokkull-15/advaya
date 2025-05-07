import React, { useState } from "react";
import CreatePassKeyCredential from "utils/passkey/register/createPasskeyCredential";
import validatePassKeyCreation from "utils/passkey/register/validatePassKeyCreation";
import { useDispatch } from "react-redux";
import { addUserAccount } from "redux-functionality/slices/userAccountsSlice";
import generateRandomString from "utils/generators/randomString";

interface Props {
  onRegister: () => void;
  onReturnToSignIn: () => void;
}

const Register = ({ onRegister, onReturnToSignIn }: Props) => {
  const dispatch = useDispatch();

  const [username, setUsername] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("idle");
  const [fileHash, setFileHash] = useState(null);
  const [copied, setCopied] = useState(false);

  const onUserNameChanged = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(ev.target.value);
  };

  const onDisplayNameChanged = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayName(ev.target.value);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    const selectedFile = files && files.length > 0 ? files[0] : null;
    if (selectedFile) {
      setFile(selectedFile);
      setStatus("ready");
    } else {
      setFile(null);
      setStatus("idle");
    }
  };

  const createPassKey = async () => {
    const userId = generateRandomString(16);
    console.log("✅  Created userId : ", userId);
    const challengeBufferString = generateRandomString(16);
    console.log("✅ Created challengeBufferString : ", challengeBufferString);

    try {
      const credential = await CreatePassKeyCredential(
        username.toLowerCase(),
        displayName.toLowerCase(),
        challengeBufferString,
        userId
      );

      console.log("✅ Created Pass Key Credential ! ");

      if (credential) {
        console.log("✅ Credential is not null : ", credential);
        const challenge = validatePassKeyCreation(credential);
        switch (challenge) {
          case null:
            console.log("❌ PassKey verification failed.");
            return;
          default:
            console.log(
              "✅ PassKey verification passed with challenge : ",
              challenge
            );
            dispatch(
              addUserAccount({
                userId: userId,
                username: username,
                displayName: displayName,
                challengeBuffer: challengeBufferString,
                challenge: challenge,
              })
            );
            onRegister();
            break;
        }
      } else {
        console.log("❌ Credential does not exist.");
      }
    } catch (error) {
      console.log("❌ Error creating credential");
      console.log("ERROR : ", error);
    }
  };

  const uploadFile = async () => {
    if (!file) {
      setStatus("error");
      return;
    }

    setStatus("uploading");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        {
          method: "POST",
          body: formData,
          headers: {
            pinata_api_key: "51f3b762d94e2090c0c1",
            pinata_secret_api_key: "c854699b2f711ca265050b522f31fd83af4376c8d92537dd2d98a17a367ce58f",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setFileHash(data.IpfsHash);
      setStatus("uploaded");
      console.log(data.IpfsHash);
    } catch (error) {
      console.error("Error uploading file:", error);
      setStatus("error");
    }
  };

  const copyToClipboard = () => {
    if (fileHash) {
      navigator.clipboard.writeText(fileHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="absolute top-0 left-0 w-full">
        <div className="bg-blue-600 h-2 w-full"></div>
      </div>
      
      <div className="max-w-md w-full relative p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl border border-gray-200">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-blue-600 p-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-black mb-2 text-center">TN-KUN</h2>
          <p className="text-center text-gray-600 mb-6">
            Create your account — your journey starts with a secure step
          </p>
          
          <div className="space-y-4">
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  placeholder="you@example.com"
                  type="email"
                  autoComplete="username webauthn"
                  value={username}
                  onChange={onUserNameChanged}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-gray-50"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="displayName"
                  placeholder="Your full name"
                  type="text"
                  value={displayName}
                  onChange={onDisplayNameChanged}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-gray-50"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="idVerification" className="block text-sm font-medium text-gray-700 mb-1">
                ID Verification Document
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md bg-gray-50">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, PDF up to 10MB
                  </p>
                </div>
              </div>
            </div>
            
            {status === "ready" && (
              <div className="p-4 bg-blue-50 rounded-md border border-blue-100">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Verification Ready</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>Your document is ready for Anon Aadhaar verification.</p>
                    </div>
                    <div className="mt-3">
                      <button
                        onClick={uploadFile}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Verify Document
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {status === "uploading" && (
              <div className="flex justify-center items-center py-4">
                <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="ml-2 text-gray-600">Verifying your document...</span>
              </div>
            )}
            
            {status === "uploaded" && fileHash && (
              <div className="p-4 bg-green-50 rounded-md border border-green-100 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Verification Successful</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>Your document has been securely verified.</p>
                      <div className="mt-2 flex items-center text-xs font-mono bg-black text-green-400 p-2 rounded-md overflow-x-auto">
                        <span>Hash: {fileHash}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <button
                        onClick={copyToClipboard}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        {copied ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            Copy Hash
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {status === "error" && (
              <div className="p-4 bg-red-50 rounded-md border border-red-100">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 001.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Verification Failed</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>There was an error verifying your document. Please try again.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={createPassKey}
              className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center mt-6"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Complete Registration
            </button>
            
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Already have an account?{' '}
                <button
                  onClick={onReturnToSignIn}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  Sign In
                </button>
              </p>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                By registering, you agree to our{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;