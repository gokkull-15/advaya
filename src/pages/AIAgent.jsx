import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Mic, Square, Send, Volume2, Globe, User, Trash2 } from 'lucide-react';
import axios from 'axios';

// Types
const LANGUAGES = {
  english: { code: 'en-US', label: 'English', nativeLabel: 'English', backendCode: 'en' },
  tamil: { code: 'ta-IN', label: 'Tamil', nativeLabel: 'தமிழ்', backendCode: 'ta' },
  kannada: { code: 'kn-IN', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ', backendCode: 'kn' },
  telugu: { code: 'te-IN', label: 'Telugu', nativeLabel: 'తెలుగు', backendCode: 'te' },
  hindi: { code: 'hi-IN', label: 'Hindi', nativeLabel: 'हिन्दी', backendCode: 'hi' }
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
      
      // Set timeout to reset speaking state when done
      const utterance = new SpeechSynthesisUtterance(message.text);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
    }
  };

  return (
    <div className={`flex ${isAi ? 'justify-start' : 'justify-end'} mb-4 group`}>
      <div className={`relative max-w-[80%] px-4 py-3 rounded-lg shadow-sm ${
        isAi ? 'bg-blue-100 text-gray-800 rounded-tl-none' : 'bg-indigo-600 text-white rounded-tr-none'
      }`}>
        <div className="flex items-start mb-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
            isAi ? 'bg-blue-500 text-white' : 'bg-indigo-800 text-white'
          }`}>
            {isAi ? (
              <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
              </div>
            ) : (
              <User size={16} />
            )}
          </div>
          <div className="flex-1">
            <p className={`text-sm font-medium ${isAi ? 'text-blue-700' : 'text-white'}`}>
              {isAi ? 'AI Lawyer' : 'You'}
            </p>
            <p className={`text-xs opacity-70 ${isAi ? 'text-gray-600' : 'text-blue-100'}`}>
              {new Date(message.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <p className={`text-md ${isAi ? 'text-gray-800' : 'text-white'}`}>
          {message.text}
        </p>
        {isAi && (
          <button
            onClick={handleSpeak}
            className={`absolute bottom-1 right-1 p-1.5 rounded-full transition-opacity duration-200 ${
              isAi ? 'text-blue-600 hover:bg-blue-200' : 'text-blue-100 hover:bg-indigo-700'
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

// Speech Services
const startSpeechRecognition = (language, onInterimResult, onFinalResult) => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert('Speech recognition is not supported in this browser.');
    return { stop: () => {} };
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.lang = LANGUAGES[language].code;
  recognition.continuous = false; // Changed to false to stop after first result
  recognition.interimResults = true;
  
  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(result => result[0].transcript)
      .join('');
    
    if (event.results[0].isFinal) {
      onFinalResult(transcript);
    } else {
      onInterimResult(transcript);
    }
  };
  
  recognition.onerror = (event) => {
    console.error('Speech recognition error', event.error);
  };
  
  recognition.start();
  return { stop: () => recognition.stop() };
};

const speakText = (text, language) => {
  if (!('speechSynthesis' in window)) {
    alert('Text-to-speech is not supported in this browser.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANGUAGES[language].code;
  
  // Get voices and try to find a matching one
  const voices = window.speechSynthesis.getVoices();
  
  // Try to find a voice for the selected language
  const languageVoices = voices.filter(voice => 
    voice.lang.startsWith(LANGUAGES[language].code.split('-')[0])
  );

  if (languageVoices.length > 0) {
    // Prefer female voices if available
    const femaleVoice = languageVoices.find(voice => 
      voice.name.toLowerCase().includes('female') || 
      voice.name.toLowerCase().includes('woman')
    );
    
    utterance.voice = femaleVoice || languageVoices[0];
    
    // Adjust parameters for better sound
    utterance.rate = 0.9;
    utterance.pitch = femaleVoice ? 1.0 : 1.2;
  }

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

  // Load voices when component mounts
  useEffect(() => {
    if ('speechSynthesis' in window) {
      // Some browsers need this to populate voices
      window.speechSynthesis.onvoiceschanged = () => {
        console.log('Voices loaded:', window.speechSynthesis.getVoices());
      };
      
      // Force voices to load
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
        // Send to your backend API
        const response = await axios.post('http://localhost:10000/api/chat', {
          text,
          language: LANGUAGES[language].backendCode
        });

        if (response.data.response) {
          addMessage(response.data.response, 'ai', language);
          
          // Auto-speak AI response in selected language
          if (response.data.response) {
            speakText(response.data.response, language);
          }
        }
      } catch (error) {
        console.error('Error:', error);
        addMessage("Sorry, I couldn't process your request. Please try again.", 'ai', language);
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
    <div className="flex flex-col h-screen max-h-screen bg-gray-50">
      {/* Header */}
      <header className="p-4 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center mr-3">
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-indigo-600" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">AI Lawyer</h1>
            <p className="text-sm text-gray-500">Multilingual Legal Assistant</p>
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
                    currentLanguage === key ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
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
      <div className="flex-1 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-gray-300" />
              </div>
              <p className="text-center text-lg font-medium mb-1">AI Lawyer Chat</p>
              <p className="text-center text-sm">
                Ask legal questions in your preferred language using voice or text
              </p>
            </div>
          ) : (
            messages.map(message => (
              <MessageItem key={message.id} message={message} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {isProcessing && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white to-transparent h-16 flex items-end justify-center pb-2">
            <div className="bg-indigo-600 text-white text-sm px-4 py-1.5 rounded-full shadow-md flex items-center">
              <div className="flex space-x-1 mr-2">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-white rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
              <span>AI is thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Voice controls and input */}
      <div className="px-4 py-3 bg-white border-t border-gray-200">
        {voiceState.isRecording && (
          <div className="flex items-center justify-between bg-gray-100 rounded-lg p-4 mb-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 mb-1">Recording...</p>
              <p className="text-gray-800">
                {voiceState.transcript || 'Speak now...'}
              </p>
            </div>
            <button
              onClick={stopRecording}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
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
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
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
              placeholder="Type your message..."
              className="w-full resize-none p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              rows={1}
              style={{ maxHeight: '120px', minHeight: '46px' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="absolute right-2 bottom-2 p-2 text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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