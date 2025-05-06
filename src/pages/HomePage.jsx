import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';

function HomePage() {
  const navigate = useNavigate();
  const [showDialPad, setShowDialPad] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [callStatus, setCallStatus] = useState('');
  const [transcript, setTranscript] = useState('');
  const [audioURL, setAudioURL] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  
  // SOS state
  const [sosMode, setSosMode] = useState(false);
  const [sosPhrase, setSosPhrase] = useState('help me');
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [userPhoneNumber, setUserPhoneNumber] = useState('');
  const [showSosSettings, setShowSosSettings] = useState(false);
  const [newContact, setNewContact] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const callTimerRef = useRef(null);
  const recognitionRef = useRef(null);
  const sosRecognitionRef = useRef(null);
  const alarmAudioRef = useRef(null);
  const alertTimeoutRef = useRef(null);

  // Initialize speech recognition for calls
  const initSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setCallStatus('Speech recognition not supported');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(prev => {
        const newTranscript = prev + finalTranscript;
        try {
          localStorage.setItem('callTranscript', newTranscript);
        } catch (error) {
          console.error('Error saving to localStorage:', error);
        }
        return newTranscript;
      });
    };

    recognition.onerror = (event) => {
      console.error('Recognition error:', event.error);
      setCallStatus(`Speech error: ${event.error}`);
    };

    recognitionRef.current = recognition;
    return recognition;
  };

  // Initialize SOS speech recognition
  const initSosRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in your browser');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript.toLowerCase() + ' ';
        }
      }

      if (finalTranscript.includes(sosPhrase.toLowerCase())) {
        triggerSosAlert();
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        console.error('SOS Recognition error:', event.error);
      }
      
      if (sosMode && event.error !== 'aborted') {
        setTimeout(() => {
          if (sosRecognitionRef.current) {
            sosRecognitionRef.current.start();
          }
        }, 1000);
      }
    };

    recognition.onend = () => {
      if (sosMode) {
        setTimeout(() => {
          if (sosRecognitionRef.current) {
            sosRecognitionRef.current.start();
          }
        }, 500);
      }
    };

    return recognition;
  };

  const triggerSosAlert = () => {
    // Clear any previous alarm
    if (alarmAudioRef.current) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current = null;
    }
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }

    // Initialize alarm audio
    alarmAudioRef.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
    alarmAudioRef.current.loop = true;
    alarmAudioRef.current.play();

    // Show persistent alert
    toast.error('🆘 DISTRESS SIGNAL DETECTED! Sending emergency alerts...', {
      autoClose: false,
      closeButton: false,
      draggable: false,
      closeOnClick: false
    });

    // Construct emergency message
    const message = `🆘 EMERGENCY ALERT!\n\n${userPhoneNumber || 'User'} is in DANGER!\n\nLast known location: ${window.location.href}\nTime: ${new Date().toLocaleString()}\n\nThis is an automated distress signal. Please respond immediately.`;

    // Send to all emergency contacts
    emergencyContacts.forEach(contact => {
      if (contact) {
        // WhatsApp
        const whatsappUrl = `https://wa.me/${contact}?text=${encodeURIComponent(message)}`;
        sendSilentRequest(whatsappUrl);
        
        // SMS
        const smsUrl = `sms:${contact}?body=${encodeURIComponent(message)}`;
        sendSilentRequest(smsUrl);
      }
    });

    // Send to police
    const policeNumber = '100';
    const policeWhatsappUrl = `https://wa.me/${policeNumber}?text=${encodeURIComponent(message)}`;
    sendSilentRequest(policeWhatsappUrl);
    const policeSmsUrl = `sms:${policeNumber}?body=${encodeURIComponent(message)}`;
    sendSilentRequest(policeSmsUrl);

    // Stop alarm after 15 seconds
    alertTimeoutRef.current = setTimeout(() => {
      if (alarmAudioRef.current) {
        alarmAudioRef.current.pause();
        alarmAudioRef.current = null;
      }
    }, 15000);
  };

  const sendSilentRequest = (url) => {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSosMode = () => {
    if (!sosMode) {
      if (!userPhoneNumber || emergencyContacts.length === 0) {
        toast.warning('Please configure SOS settings first');
        setShowSosSettings(true);
        return;
      }
      
      const recognition = initSosRecognition();
      if (recognition) {
        try {
          recognition.start();
          sosRecognitionRef.current = recognition;
          setSosMode(true);
          toast.success('🆘 SOS mode activated. System is listening...', { autoClose: 3000 });
        } catch (err) {
          toast.error('Failed to start SOS: ' + err.message);
        }
      }
    } else {
      if (sosRecognitionRef.current) {
        sosRecognitionRef.current.stop();
        sosRecognitionRef.current = null;
      }
      if (alarmAudioRef.current) {
        alarmAudioRef.current.pause();
        alarmAudioRef.current = null;
      }
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
      setSosMode(false);
      toast.info('SOS mode deactivated', { autoClose: 3000 });
    }
  };

  const addEmergencyContact = () => {
    if (newContact && !emergencyContacts.includes(newContact)) {
      const updatedContacts = [...emergencyContacts, newContact];
      setEmergencyContacts(updatedContacts);
      localStorage.setItem('emergencyContacts', JSON.stringify(updatedContacts));
      setNewContact('');
      toast.success('Contact added');
    }
  };

  const removeEmergencyContact = (contact) => {
    const updatedContacts = emergencyContacts.filter(c => c !== contact);
    setEmergencyContacts(updatedContacts);
    localStorage.setItem('emergencyContacts', JSON.stringify(updatedContacts));
    toast.info('Contact removed');
  };

  // Load saved data
  useEffect(() => {
    const loadData = () => {
      try {
        const contacts = localStorage.getItem('emergencyContacts');
        if (contacts) setEmergencyContacts(JSON.parse(contacts));
        
        const phrase = localStorage.getItem('sosPhrase');
        if (phrase) setSosPhrase(phrase);
        
        const number = localStorage.getItem('userPhoneNumber');
        if (number) setUserPhoneNumber(number);

        const transcript = localStorage.getItem('callTranscript');
        if (transcript) setTranscript(transcript);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  // Save data when changed
  useEffect(() => {
    if (sosPhrase) localStorage.setItem('sosPhrase', sosPhrase);
  }, [sosPhrase]);

  useEffect(() => {
    if (userPhoneNumber) localStorage.setItem('userPhoneNumber', userPhoneNumber);
  }, [userPhoneNumber]);

  const startRecording = async () => {
    try {
      setCallStatus('Initializing...');
      setTranscript('');
      setAudioURL('');
      localStorage.removeItem('callTranscript');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        .catch(err => {
          throw new Error(`Microphone access denied: ${err.message}`);
        });

      const recognition = initSpeechRecognition();
      if (!recognition) return;

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioURL(URL.createObjectURL(audioBlob));
      };

      recognition.start();
      mediaRecorderRef.current.start(100);
      
      setIsRecording(true);
      setCallStatus('Recording...');

      let seconds = 0;
      callTimerRef.current = setInterval(() => {
        seconds++;
        setCallDuration(seconds);
      }, 1000);

    } catch (err) {
      console.error('Recording error:', err);
      setCallStatus(`Error: ${err.message}`);
      stopRecording();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    clearInterval(callTimerRef.current);
    setIsRecording(false);
    setCallStatus(transcript ? 'Call completed' : 'No speech detected');
    localStorage.setItem('callTranscript', transcript);
  };

  const handleNumberClick = (number) => {
    if (phoneNumber.length < 15) {
      const newPhoneNumber = phoneNumber + number;
      setPhoneNumber(newPhoneNumber);
      setValidationMessage('');
      
      const emergencyNumbers = ['911', '112', '100'];
      if (newPhoneNumber.length >= 3 && !emergencyNumbers.some(num => num.startsWith(newPhoneNumber) || newPhoneNumber.startsWith(num))) {
        setValidationMessage('Invalid number');
      }
    }
  };

  const handleCall = () => {
    const emergencyNumbers = ['911', '112', '100'];
    if (!phoneNumber) return;
  
    if (!emergencyNumbers.includes(phoneNumber)) {
      setValidationMessage('Only emergency numbers can be dialed');
      toast.error('Only emergency numbers can be dialed');
      return;
    }
  
    setIsCalling(true);
    setCallDuration(0);
    startRecording();
  };

  const endCall = () => {
    stopRecording();
    setIsCalling(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sosRecognitionRef.current) {
        sosRecognitionRef.current.stop();
      }
      if (alarmAudioRef.current) {
        alarmAudioRef.current.pause();
      }
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto p-8">
      <header className="flex justify-between items-center mb-8">
        <div className="text-2xl font-bold text-gray-900">FIRM3</div>
        <div className="flex gap-4 items-center">
          <button 
            className={`px-4 py-2 rounded-lg ${sosMode ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-200 hover:bg-gray-300'}`}
            onClick={toggleSosMode}
          >
            {sosMode ? 'SOS ACTIVE' : 'Enable SOS'}
          </button>
          <button 
            className="px-4 py-2 rounded-lg hover:bg-gray-100"
            onClick={() => navigate('/file-complaint')}
          >
            Create Complaint
          </button>
          <button 
            className="px-4 py-2 rounded-lg hover:bg-gray-100"
            onClick={() => navigate('/track-complaint')}
          >
            Track Complaint
          </button>
          
        </div>
      </header>

      {/* SOS Settings Modal */}
      {showSosSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
            <h2 className="text-xl font-semibold mb-4">SOS Settings</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Your Phone Number</label>
              <input
                type="tel"
                value={userPhoneNumber}
                onChange={(e) => setUserPhoneNumber(e.target.value)}
                className="w-full p-2 border rounded-lg"
                placeholder="+1234567890"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Trigger Phrase</label>
              <input
                type="text"
                value={sosPhrase}
                onChange={(e) => setSosPhrase(e.target.value)}
                className="w-full p-2 border rounded-lg"
                placeholder="help me"
              />
              <p className="text-xs text-gray-500 mt-1">System will activate when this phrase is spoken</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Emergency Contacts</label>
              <div className="flex mb-2">
                <input
                  type="tel"
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  className="flex-1 p-2 border rounded-l-lg"
                  placeholder="+1234567890"
                />
                <button
                  onClick={addEmergencyContact}
                  className="bg-blue-500 text-white px-3 rounded-r-lg"
                >
                  Add
                </button>
              </div>
              
              <div className="max-h-40 overflow-y-auto">
                {emergencyContacts.map((contact, i) => (
                  <div key={i} className="flex justify-between items-center p-2 border-b">
                    <span>{contact}</span>
                    <button
                      onClick={() => removeEmergencyContact(contact)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg"
                onClick={() => setShowSosSettings(false)}
              >
                Save
              </button>
              <button
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg"
                onClick={() => setShowSosSettings(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOS Active Indicator */}
      {sosMode && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg animate-pulse">
          🆘 SOS ACTIVE
        </div>
      )}

      {/* Dial Pad Modal */}
      {showDialPad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
            {isCalling ? (
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-full bg-green-100 animate-ping absolute inset-0 mx-auto"></div>
                  <div className="w-24 h-24 rounded-full bg-green-200 flex items-center justify-center mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                </div>

                <h2 className="text-xl font-semibold mb-2">Emergency Call</h2>
                <p className="text-lg mb-1">Calling: {phoneNumber}</p>
                <p className="text-2xl font-mono mb-4">{formatTime(callDuration)}</p>
                
                <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm font-medium">Status: {callStatus}</p>
                  {isRecording && (
                    <div className="flex items-center mt-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                      <span className="text-xs">Recording</span>
                    </div>
                  )}
                  {transcript && (
                    <div className="mt-2 text-xs text-gray-600">
                      <p className="font-medium">Transcript:</p>
                      <p className="whitespace-pre-wrap">"{transcript}"</p>
                    </div>
                  )}
                </div>
                
                {audioURL && (
                  <div className="mb-4">
                    <audio controls src={audioURL} className="w-full" />
                  </div>
                )}
                
                <button
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium"
                  onClick={endCall}
                >
                  End Call
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">Emergency Dial</h2>
                  <div className="text-sm text-gray-600 mb-2">
                    <p>Only emergency numbers can be dialed (911, 112, 100)</p>
                  </div>
                  
                  <div className="text-3xl font-mono bg-gray-100 p-3 rounded-lg">
                    {phoneNumber || <span className="text-gray-400">Enter number</span>}
                  </div>
                  
                  {validationMessage && (
                    <div className="mt-2 text-sm text-red-600 font-medium">
                      {validationMessage}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((num) => (
                    <button
                      key={num}
                      className="aspect-square w-full rounded-full bg-[#CBFF96] hover:bg-[#b2e67d] text-gray-900 text-2xl font-medium"
                      onClick={() => handleNumberClick(num)}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg"
                    onClick={handleCall}
                    disabled={!phoneNumber}
                  >
                    Call
                  </button>
                  <button
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg"
                    onClick={() => {
                      setShowDialPad(false);
                      setPhoneNumber('');
                      setValidationMessage('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
                
                <div className="mt-3">
                  <button
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg"
                    onClick={() => {
                      setPhoneNumber(prev => prev.slice(0, -1));
                      setValidationMessage('');
                    }}
                  >
                    Backspace
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <main>
        <div className="flex justify-between items-center mb-16">
          <div className="max-w-[600px]">
            <h1 className="text-5xl font-bold mb-6">File and Track Your Complaints Securely</h1>
            <p className="text-xl text-gray-600 mb-8">
              Our platform provides secure complaint registration with emergency SOS features.
            </p>
            <div className="flex gap-4">
              <button 
                className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800"
                onClick={() => navigate('/file-complaint')}
              > 
                File a Complaint
              </button>
              <button 
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
                onClick={() => setShowDialPad(true)}
              >
                Emergency Call
              </button> 
              <button 
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                onClick={() => navigate('/ai-agent')}
              >
                AI Agent
              </button> 
            </div>
          </div>
        </div>

        <div className="mt-16">
          <span className="bg-[#CBFF96] text-gray-900 px-4 py-2 rounded-full inline-block mb-6">
            Features
          </span>
          <p className="text-gray-600 text-lg max-w-[800px] mb-12">
            Our system offers comprehensive safety features including automatic emergency alerts.
          </p>
          
          <div className="grid grid-cols-3 gap-8">
            <div className="p-8 rounded-xl min-h-[200px] bg-gray-100">
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p>Immediate assistance when you need it most</p>
            </div>
            <div className="p-8 rounded-xl min-h-[200px] bg-[#CBFF96]">
              <h3 className="text-xl font-semibold mb-2">Emergency SOS</h3>
              <p>Voice-activated distress signals with automatic alerts</p>
            </div>
            <div className="p-8 rounded-xl min-h-[200px] bg-gray-900 text-white">
              <h3 className="text-xl font-semibold mb-2">Secure System</h3>
              <p>Your data and communications are protected</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default HomePage;