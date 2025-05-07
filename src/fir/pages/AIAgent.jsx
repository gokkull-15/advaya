import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Mic, Square, Send, Volume2, Globe, User, Trash2 } from 'lucide-react';
import axios from 'axios';
import BG from "../assets/ai.png"

// Types
const LANGUAGES = {
  english: { code: 'en-US', label: 'English', nativeLabel: 'English', backendCode: 'en' },
  tamil: { code: 'ta-IN', label: 'Tamil', nativeLabel: 'தமிழ்', backendCode: 'ta' },
  kannada: { code: 'kn-IN', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ', backendCode: 'kn' },
  telugu: { code: 'te-IN', label: 'Telugu', nativeLabel: 'తెలుగు', backendCode: 'te' },
  hindi: { code: 'hi-IN', label: 'Hindi', nativeLabel: 'हिन्दी', backendCode: 'hi' }
};

// Language-specific UI text
// Language-specific UI text
const UI_TEXT = {
  english: {
    chatTitle: 'AI Lawyer Chat',
    chatDescription: 'Ask legal questions in your preferred language using voice or text',
    recording: 'Recording...',
    speakNow: 'Speak now...',
    aiThinking: 'AI is thinking...',
    typeMessage: 'Type your message...',
    speechRecognitionError: 'Speech recognition is not supported in this browser.',
    speechSynthesisError: 'Text-to-speech is not supported in this browser.',
    recognitionError: 'Error in speech recognition. Please try again.',
    noSpeechError: 'No speech detected. Please speak clearly and try again.',
    audioCaptureError: 'Microphone access denied or unavailable. Please check your settings.',
    notAllowedError: 'Speech recognition permission denied. Please enable microphone access.'
  },
  tamil: {
    chatTitle: 'AI வழக்கறிஞர் அரட்டை',
    chatDescription: 'உங்கள் விருப்பமான மொழியில் குரல் அல்லது உரை மூலம் சட்ட கேள்விகளைக் கேளுங்கள்',
    recording: 'பதிவு செய்கிறது...',
    speakNow: 'இப்போது பேசுங்கள்...',
    aiThinking: 'AI சிந்திக்கிறது...',
    typeMessage: 'உங்கள் செய்தியை தட்டச்சு செய்யவும்...',
    speechRecognitionError: 'இந்த உலாவியில் பேச்சு அங்கீகாரம் ஆதரிக்கப்படவில்லை.',
    speechSynthesisError: 'இந்த உலாவியில் பேச்சு உருவாக்கம் ஆதரிக்கப்படவில்லை.',
    recognitionError: 'பேச்சு அங்கீகாரத்தில் பிழை. மீண்டும் முயற்சிக்கவும்.',
    noSpeechError: 'பேச்சு கண்டறியப்படவில்லை. தெளிவாக பேசி மீண்டும் முயற்சிக்கவும்.',
    audioCaptureError: 'மைக்ரோபோன் அணுகல் மறுக்கப்பட்டது அல்லது கிடைக்கவில்லை. உங்கள் அமைப்புகளை சரிபார்க்கவும்.',
    notAllowedError: 'பேச்சு அங்கீகார அனுமதி மறுக்கப்பட்டது. மைக்ரோபோன் அணுகலை இயக்கவும்.'
  },
  kannada: {
    chatTitle: 'AI ವಕೀಲ ಚಾಟ್',
    chatDescription: 'ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯಲ್ಲಿ ಧ್ವನಿ ಅಥವಾ ಪಠ್ಯದ ಮೂಲಕ ಕಾನೂನು ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ',
    recording: 'ರೆಕಾರ್ಡಿಂಗ್...',
    speakNow: 'ಈಗ ಮಾತನಾಡಿ...',
    aiThinking: 'AI ಯೋಚಿಸುತ್ತಿದೆ...',
    typeMessage: 'ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ...',
    speechRecognitionError: 'ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಭಾಷಣ ಗುರುತಿಸುವಿಕೆಯನ್ನು ಬೆಂಬಲಿಸಲಾಗಿಲ್ಲ.',
    speechSynthesisError: 'ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಪಠ್ಯ-ಭಾಷಣವನ್ನು ಬೆಂಬಲಿಸಲಾಗಿಲ್ಲ.',
    recognitionError: 'ಭಾಷಣ ಗುರುತಿಸುವಿಕೆಯಲ್ಲಿ ದೋಷ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
    noSpeechError: 'ಯಾವುದೇ ಭಾಷಣ ಕಂಡುಬಂದಿಲ್ಲ. ಸ್ಪಷ್ಟವಾಗಿ ಮಾತನಾಡಿ ಮತ್ತು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
    audioCaptureError: 'ಮೈಕ್ರೊಫೋನ್ ಪ್ರವೇಶವನ್ನು ನಿರಾಕರಿಸಲಾಗಿದೆ ಅಥವಾ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.',
    notAllowedError: 'ಭಾಷಣ ಗುರುತಿಸುವಿಕೆಯ ಅನುಮತಿಯನ್ನು ನಿರಾಕರಿಸಲಾಗಿದೆ. ಮೈಕ್ರೊಫೋನ್ ಪ್ರವೇಶವನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಿ.'
  },
  telugu: {
    chatTitle: 'AI లాయర్ చాట్',
    chatDescription: 'మీకు ఇష్టమైన భాషలో వాయిస్ లేదా టెక్స్ట్ ద్వారా చట్టపరమైన ప్రశ్నలు అడగండి',
    recording: 'రికార్డింగ్...',
    speakNow: 'ఇప్పుడు మాట్లాడండి...',
    aiThinking: 'AI ఆలోచిస్తోంది...',
    typeMessage: 'మీ సందేశాన్ని టైప్ చేయండి...',
    speechRecognitionError: 'ఈ బ్రౌజర్‌లో స్పీచ్ రికగ్నిషన్ సపోర్ట్ చేయబడదు.',
    speechSynthesisError: 'ఈ బ్రౌజర్‌లో టెక్స్ట్-టు-స్పీచ్ సపోర్ట్ చేయబడదు.',
    recognitionError: 'స్పీచ్ రికగ్నిషన్‌లో లోపం. మళ్లీ ప్రయత్నించండి.',
    noSpeechError: 'మాటలు కనిపించలేదు. స్పష్టంగా మాట్లాడి మళ్లీ ప్రయత్నించండి.',
    audioCaptureError: 'మైక్రోఫోన్ యాక్సెస్ నిరాకరించబడింది లేదా అందుబాటులో లేదు. మీ సెట్టింగ్‌లను తనిఖీ చేయండి.',
    notAllowedError: 'స్పీచ్ రికగ్నిషన్ అనుమతి నిరాకరించబడింది. మైక్రోఫోన్ యాక్సెస్‌ను ఆన్ చేయండి.'
  },
  hindi: {
    chatTitle: 'AI वकील चैट',
    chatDescription: 'अपनी पसंदीदा भाषा में आवाज या टेक्स्ट के माध्यम से कानूनी सवाल पूछें',
    recording: 'रिकॉर्डिंग...',
    speakNow: 'अब बोलें...',
    aiThinking: 'AI सोच रहा है...',
    typeMessage: 'अपना संदेश टाइप करें...',
    speechRecognitionError: 'इस ब्राउज़र में वाक् पहचान समर्थित नहीं है।',
    speechSynthesisError: 'इस ब्राउज़र में टेक्स्ट-टू-स्पीच समर्थित नहीं है।',
    recognitionError: 'वाक् पहचान में त्रुटि। कृपया फिर से प्रयास करें।',
    noSpeechError: 'कोई वाक् नहीं मिली। स्पष्ट रूप से बोलें और फिर से प्रयास करें।',
    audioCaptureError: 'माइक्रोफ़ोन तक पहुंच अस्वीकृत है या उपलब्ध नहीं है। कृपया अपनी सेटिंग्स जांचें।',
    notAllowedError: 'वाक् पहचान की अनुमति अस्वीकृत है। कृपया माइक्रोफ़ोन पहुंच सक्षम करें।'
  }
};

// Speech Services
const startSpeechRecognition = (language, onInterimResult, onFinalResult) => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert(UI_TEXT[language].speechRecognitionError);
    return { stop: () => {} };
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.lang = LANGUAGES[language].code;
  recognition.continuous = false;
  recognition.interimResults = true;
  
  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(result => result[0].transcript)
      .join('')
      .trim();

    // Ignore empty or nonsensical transcripts
    if (!transcript || /^\s*[a-zA-Z0-9]{10,}\s*$/.test(transcript)) {
      return; // Skip invalid input like "bjdgsdgdfs"
    }
    
    if (event.results[0].isFinal) {
      onFinalResult(transcript);
    } else {
      onInterimResult(transcript);
    }
  };
  
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    const errorMessages = {
      'no-speech': UI_TEXT[language].noSpeechError,
      'audio-capture': UI_TEXT[language].audioCaptureError,
      'not-allowed': UI_TEXT[language].notAllowedError
    };
    const errorMessage = errorMessages[event.error] || UI_TEXT[language].recognitionError;
    alert(errorMessage);
  };
  
  recognition.onend = () => {
    recognition.stop();
  };

  recognition.start();
  return { stop: () => recognition.stop() };
};

// Message Component
const MessageItem = ({ message }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isAi = message.sender === 'ai';
  
  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakText(message.text, message.language);
      
      const utterance = new SpeechSynthesisUtterance(message.text);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
    }
  };

  return (
    <div className={`flex ${isAi ? 'justify-start' : 'justify-end'} mb-4 group`} >
      <div className={`relative max-w-[80%] px-4 py-3 rounded-lg shadow-sm ${
        isAi ? 'bg-white text-black rounded-tl-none' : 'bg-gray-300 text-black rounded-tr-none'
      }`}>
        <div className="flex items-start mb-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
            isAi ? 'bg-gray-300 text-black' : 'bg-gray-500 text-black'
          }`}>
            {isAi ? (
              <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-black" />
              </div>
            ) : (
              <User size={16} />
            )}
          </div>
          <div className="flex-1">
            <p className={`text-sm font-medium ${isAi ? 'text-black' : 'text-black'}`}>
              {isAi ? 'AI Lawyer' : 'You'}
            </p>
            
          </div>
        </div>
        <p className={`text-md ${isAi ? 'text-gray-800' : 'text-black'}`}>
          {message.text}
        </p>
        <p className={`text-xs opacity-70 ${isAi ? 'text-gray-600' : 'text-gray-600'}`}>
              {new Date(message.timestamp).toLocaleTimeString()}
            </p>
        {isAi && (
          <button
            onClick={handleSpeak}
            className={`absolute bottom-1 right-1 p-1.5 rounded-full transition-opacity duration-200 ${
              isAi ? 'text-gray-600 hover:bg-blue-200' : 'text-blue-100 hover:bg-gray-700'
            } opacity-0 group-hover:opacity-100`}
            title={isSpeaking ? 'Stop speaking' : 'Listen'}
          >
            <Volume2 size={16} className={isSpeaking ? 'animate-pulse' : ''} />
          </button>
        )}
      </div>
    </div>
  );
};



const speakText = (text, language) => {
  if (!('speechSynthesis' in window)) {
    alert(UI_TEXT[language].speechSynthesisError);
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANGUAGES[language].code;
  
  const voices = window.speechSynthesis.getVoices();
  let selectedVoice = null;

  const languageVoices = voices.filter(voice => 
    voice.lang.startsWith(LANGUAGES[language].code.split('-')[0])
  );
  const femaleVoice = languageVoices.find(voice => 
    voice.name.toLowerCase().includes('female') || 
    voice.name.toLowerCase().includes('woman') || 
    (language === 'tamil' && voice.name.toLowerCase().includes('samantha'))
  );
  selectedVoice = femaleVoice || languageVoices[0];

  if (selectedVoice) {
    utterance.voice = selectedVoice;
    utterance.rate = language === 'tamil' ? 0.85 : 0.9;
    utterance.pitch = language === 'tamil' ? 1.1 : 1.0;
  } else {
    console.warn(`No suitable voice found for ${language}, using default.`);
  }

  utterance.onerror = () => {
    alert(UI_TEXT[language].synthesisError);
  };

  window.speechSynthesis.speak(utterance);
};

// Main Chat Interface
const AIAgent = () => {
  const [messages, setMessages] = useState([]);
  const [currentLanguage, setCurrentLanguage] = useState('english');
  const [voiceState, setVoiceState] = useState({
    isRecording: false,
    transcript: ''
  });
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        console.log('Voices loaded:', window.speechSynthesis.getVoices());
      };
      window.speechSynthesis.getVoices();
    }
  }, []);

  const addMessage = async (text, sender, language) => {
    if (!text.trim()) return;

    const newMessage = {
      id: uuidv4(),
      text,
      sender,
      timestamp: new Date(),
      language
    };

    setMessages(prev => [...prev, newMessage]);

    if (sender === 'user') {
      setIsProcessing(true);
      try {
        const response = await axios.post('http://localhost:10000/api/chat', {
          text,
          language: LANGUAGES[language].backendCode
        });

        if (response.data.response) {
          addMessage(response.data.response, 'ai', language);
          if (response.data.response) {
            speakText(response.data.response, language);
          }
        }
      } catch (error) {
        console.error('Error:', error);
        const errorMsg = UI_TEXT[language].recognitionError;
        addMessage(errorMsg, 'ai', language);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const startRecording = () => {
    setVoiceState({
      isRecording: true,
      transcript: ''
    });

    recognitionRef.current = startSpeechRecognition(
      currentLanguage,
      (interim) => setVoiceState(prev => ({ ...prev, transcript: interim })),
      (final) => {
        if (final.trim()) {
          addMessage(final, 'user', currentLanguage);
        }
        stopRecording();
      }
    );
  };

  const stopRecording = () => {
    if (recognitionRef.current?.stop) {
      recognitionRef.current.stop();
    }
    setVoiceState(prev => ({ ...prev, isRecording: false, transcript: '' }));
  };

  const handleSendMessage = () => {
    if (inputText.trim()) {
      addMessage(inputText.trim(), 'user', currentLanguage);
      setInputText('');
    }
  };

  const clearMessages = () => setMessages([]);

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-100" style={{ backgroundImage: `url(${BG})`, backgroundSize: 'cover', backgroundPosition: 'center' }} >
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `}
      </style>
      {/* Header */}
      <header className="p-4 border-b border-gray-200 shadow-sm flex items-center justify-between" >
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center mr-3">
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-black" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">AI Lawyer</h1>
            <p className="text-sm text-blue-50">Multilingual Legal Assistant</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={clearMessages}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            title="Clear conversation"
          >
            <Trash2 size={18} />
          </button>
          <div className="relative group">
            <button className="flex items-center space-x-1 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Globe size={18} />
              <span className="hidden md:inline font-medium">
                {LANGUAGES[currentLanguage].label}
              </span>
              <span className="md:hidden">
                {LANGUAGES[currentLanguage].nativeLabel}
              </span>
            </button>
            <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg overflow-hidden transform scale-95 opacity-0 invisible group-hover:scale-100 group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right z-10 w-48">
              {Object.entries(LANGUAGES).map(([key, { label, nativeLabel }]) => (
                <button
                  key={key}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center justify-between ${
                    currentLanguage === key ? 'bg-indigo-50 text-black' : 'text-gray-700'
                  }`}
                  onClick={() => setCurrentLanguage(key)}
                >
                  <span>{label}</span>
                  <span className="text-sm opacity-70">{nativeLabel}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>
  
      {/* Messages */}
      <div className="flex-1 h-full relative">
        <div className="flex-1 max-h-full overflow-y-auto px-4 py-2 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white">
              <div className="w-16 h-16 mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-gray-300" />
              </div>
              <p className="text-center text-lg font-medium mb-1">
                {UI_TEXT[currentLanguage].chatTitle}
              </p>
              <p className="text-center text-sm">
                {UI_TEXT[currentLanguage].chatDescription}
              </p>
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              {messages.map(message => (
                <MessageItem key={message.id} message={message} />
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {isProcessing && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white to-transparent h-16 flex items-end justify-center pb-2">
            <div className="bg-black text-white text-sm px-4 py-1.5 rounded-full shadow-md flex items-center">
              <div className="flex space-x-1 mr-2">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-white rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
              <span>{UI_TEXT[currentLanguage].aiThinking}</span>
            </div>
          </div>
        )}
      </div>
  
      {/* Voice controls and input */}
      <div className="px-4 py-3 border-t border-gray-200">
        {voiceState.isRecording && (
          <div className="flex items-center justify-between bg-gray-100 rounded-lg p-4 mb-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 mb-1">
                {UI_TEXT[currentLanguage].recording}
              </p>
              <p className="text-gray-800">
                {voiceState.transcript || UI_TEXT[currentLanguage].speakNow}
              </p>
            </div>
            <button
              onClick={stopRecording}
              className="p-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors"
              aria-label="Stop recording"
            >
              <Square size={18} />
            </button>
          </div>
        )}
  
        <div className="flex items-center">
          <button
            onClick={voiceState.isRecording ? stopRecording : startRecording}
            className={`p-3 rounded-full mr-3 transition-colors ${
              voiceState.isRecording
                ? 'bg-gray-500 text-white hover:bg-gray-600'
                : 'bg-black text-white hover:bg-black'
            }`}
            aria-label={voiceState.isRecording ? 'Stop recording' : 'Start recording'}
          >
            <Mic size={20} />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={UI_TEXT[currentLanguage].typeMessage}
              className="w-full resize-none p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all text-white"
              rows={1}
              style={{ maxHeight: '120px', minHeight: '46px' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="absolute right-2 bottom-2 p-2 text-black hover:bg-indigo-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAgent;