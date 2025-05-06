import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Phone, Siren, FileText, Search, AlertTriangle, Save, X, Plus, Trash2, Clock, Shield, Lock } from 'lucide-react';
import BG from "../assets/image.png"

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
        localStorage.setItem('callTranscript', newTranscript);
        return newTranscript;
      });
    };

    recognition.onerror = (event) => {
      setCallStatus(`Speech error: ${event.error}`);
    };

    recognitionRef.current = recognition;
    return recognition;
  };

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
    if (alarmAudioRef.current) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current = null;
    }
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }

    alarmAudioRef.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
    alarmAudioRef.current.loop = true;
    alarmAudioRef.current.play();

    toast.error('🆘 DISTRESS SIGNAL DETECTED! Sending emergency alerts...', {
      autoClose: false,
      closeButton: false,
      draggable: false,
      closeOnClick: false
    });

    const message = `🆘 EMERGENCY ALERT!\n\n${userPhoneNumber || 'User'} is in DANGER!\n\nLast known location: ${window.location.href}\nTime: ${new Date().toLocaleString()}\n\nThis is an automated distress signal. Please respond immediately.`;

    emergencyContacts.forEach(contact => {
      if (contact) {
        const whatsappUrl = `https://wa.me/${contact}?text=${encodeURIComponent(message)}`;
        sendSilentRequest(whatsappUrl);
        
        const smsUrl = `sms:${contact}?body=${encodeURIComponent(message)}`;
        sendSilentRequest(smsUrl);
      }
    });

    const policeNumber = '100';
    const policeWhatsappUrl = `https://wa.me/${policeNumber}?text=${encodeURIComponent(message)}`;
    sendSilentRequest(policeWhatsappUrl);
    const policeSmsUrl = `sms:${policeNumber}?body=${encodeURIComponent(message)}`;
    sendSilentRequest(policeSmsUrl);

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

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
    <div className="min-h-screen bg-cover bg-center bg-fixed" style={{ backgroundImage: `url(${BG})` }}>
      <div className="bg-black bg-opacity-60 min-h-screen">
        <header className="flex justify-between items-center p-6 bg-gradient-to-r from-purple-900 to-indigo-900 shadow-lg">
          <div className="text-3xl font-bold text-white font-['Pacifico']">TN-KUN</div>
          <div className="flex space-x-4">
            <button 
              onClick={toggleSosMode}
              className={`px-4 py-2 rounded-full text-lg share-tech-mono-regular font-semibold transition-all duration-300 flex items-center ${sosMode ? 'bg-red-600 hover:bg-red-700' : 'bg-white hover:bg-gray-200'} text-black shadow-lg hover:shadow-green-500 border-green-600 border-4`}
            >
              <Siren className="w-5 h-5 mr-2" />
              {sosMode ? 'SOS ACTIVE' : 'Enable SOS'}
            </button>
            <button 
              onClick={() => navigate('/file-complaint')}
              className="px-4 py-2 rounded-full bg-white hover:bg-gray-200 border-blue-600 border-4 text-black hover:border-blue-600 hover:border-4 share-tech-mono-regular text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-blue-600 flex items-center"
            >
              <FileText className="w-5 h-5 mr-2" />
              Create Complaint
            </button>
            <button 
              onClick={() => navigate('/track-complaint')}
              className="px-4 py-2 rounded-full bg-white hover:bg-gray-200 border-blue-600 border-4 hover:border-blue-600 hover:border-4 text-black share-tech-mono-regular text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-blue-600 flex items-center"
            >
              <Search className="w-5 h-5 mr-2" />
              Track Complaint
            </button>
          </div>
        </header>

        {showSosSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-['Poppins'] font-bold text-gray-800 mb-6 flex items-center">
                <AlertTriangle className="w-6 h-6 mr-2 text-red-600" />
                SOS Settings
              </h2>
              
              <div className="mb-4">
                <label className="block text-sm font-['Roboto'] text-gray-600 mb-1">Your Phone Number</label>
                <input
                  type="tel"
                  value={userPhoneNumber}
                  onChange={(e) => setUserPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-['Roboto']"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-['Roboto'] text-gray-600 mb-1">Trigger Phrase</label>
                <input
                  type="text"
                  value={sosPhrase}
                  onChange={(e) => setSosPhrase(e.target.value)}
                  placeholder="help me"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-['Roboto']"
                />
                <p className="text-xs text-gray-500 mt-1 font-['Roboto']">System will activate when this phrase is spoken</p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-['Roboto'] text-gray-600 mb-1">Emergency Contacts</label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="tel"
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    placeholder="+1234567890"
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-['Roboto']"
                  />
                  <button
                    onClick={addEmergencyContact}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-['Roboto'] font-semibold transition-all duration-300 flex items-center"
                  >
                    <Plus className="w-5 h-5 mr-1" />
                    Add
                  </button>
                </div>
                
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {emergencyContacts.map((contact, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-gray-100 rounded-lg">
                      <span className="text-sm font-['Roboto'] text-gray-700">{contact}</span>
                      <button
                        onClick={() => removeEmergencyContact(contact)}
                        className="text-red-500 hover:text-red-700 font-['Roboto'] text-sm font-semibold flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowSosSettings(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-['Roboto'] font-semibold transition-all duration-300 flex items-center"
                >
                  <X className="w-5 h-5 mr-1" />
                  Cancel
                </button>
                <button
                  onClick={() => setShowSosSettings(false)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-['Roboto'] font-semibold transition-all duration-300 flex items-center"
                >
                  <Save className="w-5 h-5 mr-1" />
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

{showDialPad && (
      <div 
        className="fixed inset-0 bg-cover bg-center bg-fixed flex items-center justify-center z-50" 
        style={{ backgroundImage: `url(${BG})` }}
      >
        <div className="bg-black bg-opacity-70 min-h-screen w-full flex items-center justify-center">
          <div className="bg-white bg-opacity-15 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white border-opacity-20">
            {isCalling ? (
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 border-4 border-t-transparent border-red-500 rounded-full animate-spin"></div>
                </div>

                <h2 className="text-3xl font-bold text-white mb-3 aclonica-regular flex items-center justify-center">
                  <Phone className="w-7 h-7 mr-3 text-red-400 animate-pulse" />
                  Emergency Call
                </h2>
                <p className="text-lg text-gray-100 share-tech-mono-regular">Calling: {phoneNumber}</p>
                <p className="text-2xl font-semibold text-red-400 mt-3 share-tech-mono-regular">{formatTime(callDuration)}</p>
                
                <div className="mt-6">
                  <p className="text-sm text-gray-200 share-tech-mono-regular">Status: {callStatus}</p>
                  {isRecording && (
                    <div className="flex items-center justify-center mt-3">
                      <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse mr-2"></div>
                      <span className="text-sm text-red-500 share-tech-mono-regular">Recording</span>
                    </div>
                  )}
                  {transcript && (
                    <div className="mt-4 p-4 bg-white bg-opacity-10 rounded-xl border border-white border-opacity-20">
                      <p className="text-sm font-semibold text-gray-200 share-tech-mono-regular">Transcript:</p>
                      <p className="text-sm text-gray-300 share-tech-mono-regular">"{transcript}"</p>
                    </div>
                  )}
                </div>
                
                {audioURL && (
                  <div className="mt-6">
                    <audio controls src={audioURL} className="w-full rounded-lg bg-white bg-opacity-20" />
                  </div>
                )}
                
                <button
                  onClick={endCall}
                  className="mt-8 px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full vt323-regular text-2xl transition-all duration-300 shadow-lg flex items-center mx-auto transform hover:scale-105"
                >
                  <Phone className="w-6 h-6 mr-2" />
                  End Call
                </button>
              </div>
            ) : (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white aclonica-regular flex items-center justify-center">
                    <Phone className="w-7 h-7 mr-3 text-red-400 animate-pulse" />
                    Emergency Dial
                  </h2>
                  <p className="text-sm text-gray-300 mt-2 share-tech-mono-regular">Only emergency numbers can be dialed (911, 112, 100)</p>
                  
                  <div className="mt-4 p-4 bg-white bg-opacity-10 rounded-xl border border-white border-opacity-20">
                    <span className="text-xl text-gray-100 share-tech-mono-regular">{phoneNumber || 'Enter number'}</span>
                  </div>
                  
                  {validationMessage && (
                    <div className="mt-3 text-red-500 text-sm share-tech-mono-regular">
                      {validationMessage}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleNumberClick(num)}
                      className="p-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-gray-100 rounded-xl vt323-regular text-2xl transition-all duration-300 shadow-md transform hover:scale-105"
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between mt-8 gap-4">
                  <button
                    onClick={handleCall}
                    disabled={!phoneNumber}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-full vt323-regular text-2xl transition-all duration-300 shadow-lg flex items-center justify-center transform hover:scale-105"
                  >
                    <Phone className="w-6 h-6 mr-2" />
                    Call
                  </button>
                  <button
                    onClick={() => {
                      setShowDialPad(false);
                      setPhoneNumber('');
                      setValidationMessage('');
                    }}
                    className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-full vt323-regular text-2xl transition-all duration-300 shadow-lg flex items-center justify-center transform hover:scale-105"
                  >
                    <X className="w-6 h-6 mr-2" />
                    Cancel
                  </button>
                </div>
                
                <div className="mt-6 text-center">
                  <button
                    onClick={() => {
                      setPhoneNumber(prev => prev.slice(0, -1));
                      setValidationMessage('');
                    }}
                    className="px-6 py-2 text-red-500 hover:border-2 hover:border-black bg-gray-200 hover:text-xl hover:text-red-600 vt323-regular text-lg flex items-center mx-auto transition-all duration-300"
                  >
                    <Trash2 className="w-6 h-6 mr-2" />
                    Backspace
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

        <main className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center mb-16">
            <h1 className="text-7xl font-bold text-white mb-4 vt323-regular">File and Track Your Complaints Securely</h1>
            <p className="share-tech-mono-regular text-2xl text-gray-200 max-w-2xl mx-auto reveal">
  {"Our platform provides secure complaint registration with emergency SOS features...".split("").map((char, index) => (
    <span key={index} style={{ '--i': index }}>
      {char === " " ? "\u00A0" : char}
    </span>
  ))}
</p>

            <div className="flex justify-center space-x-4 mt-8">
              <button 
                onClick={() => navigate('/file-complaint')} 
                className="px-6 py-3 bg-white share-tech-mono-regular hover:bg-gray-300 hover:border-2 border-2 border-orange-300 hover:border-orange-500 hover text-black shadow-lg shadow-orange-500 rounded-full text-xl transition-all duration-300 flex items-center"
              >
                <FileText className="w-5 h-5 mr-2" />
                File a Complaint
              </button>
              <button 
                onClick={() => setShowDialPad(true)}
                className="px-6 py-3 bg-white share-tech-mono-regular hover:bg-gray-300 hover:border-2 border-2 border-orange-300 hover:border-orange-500 hover text-black shadow-lg shadow-orange-500 rounded-full text-xl transition-all duration-300 flex items-center"
              >
                <Phone className="w-5 h-5 mr-2" />
                Emergency Call
              </button>
              <button 
                onClick={() => navigate('/ai-agent')}
                className="px-6 py-3 bg-white share-tech-mono-regular hover:bg-gray-300 hover:border-2 border-2 border-orange-300 hover:border-orange-500 hover text-black shadow-lg shadow-orange-500 rounded-full text-xl transition-all duration-300 flex items-center"
              >
                <Search className="w-5 h-5 mr-2" />
                AI Advisor
              </button>
            </div>
          </div>

          <div className="text-center">
            <span className="text-3xl share-tech-mono-regular text-white">FEATURES</span>
            <p className="text-lg share-tech-mono-regular text-gray-200 mt-2 max-w-2xl mx-auto">
              Our system offers comprehensive safety features including automatic emergency alerts.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              <div className="p-6 bg-white bg-opacity-10 rounded-xl backdrop-blur-md">
                <Clock className="w-8 h-8 text-white mx-auto mb-2" />
                <h3 className="text-xl share-tech-mono-regular font-semibold text-white">24/7 Support</h3>
                <p className="text-sm share-tech-mono-regular text-gray-200 mt-2">Immediate assistance when you need it most</p>
              </div>
              <div className="p-6 bg-white bg-opacity-10 rounded-xl backdrop-blur-md">
                <Shield className="w-8 h-8 text-white mx-auto mb-2" />
                <h3 className="text-xl share-tech-mono-regular font-semibold text-white">Emergency SOS</h3>
                <p className="text-sm share-tech-mono-regular text-gray-200 mt-2">Voice-activated distress signals with automatic alerts</p>
              </div>
              <div className="p-6 bg-white bg-opacity-10 rounded-xl backdrop-blur-md">
                <Lock className="w-8 h-8 text-white mx-auto mb-2" />
                <h3 className="text-xl share-tech-mono-regular font-semibold text-white">Secure System</h3>
                <p className="text-sm share-tech-mono-regular text-gray-200 mt-2">Your data and communications are protected</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default HomePage;