import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, Mic, MicOff, PhoneOff, Activity, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

// Local AI Response Engine - No API needed
class LocalAIEngine {
  private context: any;
  private language: string;

  constructor(context: any, language: string = 'en') {
    this.context = context;
    this.language = language;
  }

  updateContext(context: any) {
    this.context = context;
  }

  // Pattern matching for common SHG queries
  generateResponse(userMessage: string): string {
    const msg = userMessage.toLowerCase().trim();
    const { stats, members, loans, transactions } = this.context;

    // Greetings
    if (msg.match(/^(hi|hello|hey|namaste|namaskar)/)) {
      return this.language === 'hi' 
        ? `नमस्ते! मैं SHG Connect AI हूं। आज मैं आपकी कैसे मदद कर सकता हूं?`
        : `Namaste! I'm SHG Connect AI. How can I help you with your group finances today?`;
    }

    // Total savings query
    if (msg.match(/total.*saving|saving.*total|kitna.*bachat|bachat.*kitna|how much.*saved/)) {
      const totalSavings = stats?.totalSavings || members?.reduce((sum: number, m: any) => sum + (m.savingsBalance || 0), 0) || 0;
      return this.language === 'hi'
        ? `समूह की कुल बचत ₹${totalSavings.toLocaleString('en-IN')} है।`
        : `The group's total savings is ₹${totalSavings.toLocaleString('en-IN')}.`;
    }

    // Loan queries
    if (msg.match(/loan|rin|karz|outstanding|due/)) {
      const activeLoans = loans?.filter((l: any) => l.status === 'Active') || [];
      const totalOutstanding = stats?.totalLoansOutstanding || activeLoans.reduce((sum: number, l: any) => sum + (l.outstanding || l.principal || 0), 0);
      
      if (msg.match(/active|kitne|how many|count/)) {
        return this.language === 'hi'
          ? `अभी ${activeLoans.length} सक्रिय ऋण हैं, कुल बकाया ₹${totalOutstanding.toLocaleString('en-IN')} है।`
          : `There are ${activeLoans.length} active loans with total outstanding of ₹${totalOutstanding.toLocaleString('en-IN')}.`;
      }
      
      return this.language === 'hi'
        ? `समूह में ${activeLoans.length} सक्रिय ऋण हैं। कुल बकाया राशि ₹${totalOutstanding.toLocaleString('en-IN')} है।`
        : `The group has ${activeLoans.length} active loans. Total outstanding amount is ₹${totalOutstanding.toLocaleString('en-IN')}.`;
    }

    // Member queries
    if (msg.match(/member|sadasya|kitne log|how many people/)) {
      const memberCount = members?.length || 0;
      return this.language === 'hi'
        ? `समूह में ${memberCount} सदस्य हैं।`
        : `The group has ${memberCount} members.`;
    }

    // Balance/Fund query
    if (msg.match(/balance|fund|corpus|kosh|paisa/)) {
      const corpusFund = stats?.corpusFund || 0;
      return this.language === 'hi'
        ? `समूह का कोष ₹${corpusFund.toLocaleString('en-IN')} है।`
        : `The group's corpus fund is ₹${corpusFund.toLocaleString('en-IN')}.`;
    }

    // Meeting queries
    if (msg.match(/meeting|baithak|next.*meeting|agla/)) {
      return this.language === 'hi'
        ? `अगली बैठक की जानकारी के लिए कृपया बैठक पेज देखें।`
        : `Please check the Meetings page for the next meeting schedule.`;
    }

    // Transaction queries
    if (msg.match(/transaction|lenden|recent|haal/)) {
      const recentTxns = transactions?.slice(0, 3) || [];
      if (recentTxns.length === 0) {
        return this.language === 'hi'
          ? `कोई हाल का लेनदेन नहीं मिला।`
          : `No recent transactions found.`;
      }
      const txnList = recentTxns.map((t: any) => `${t.type}: ₹${t.amount}`).join(', ');
      return this.language === 'hi'
        ? `हाल के लेनदेन: ${txnList}`
        : `Recent transactions: ${txnList}`;
    }

    // Help query
    if (msg.match(/help|madad|kya kar sakte|what can you do/)) {
      return this.language === 'hi'
        ? `मैं आपकी इन चीजों में मदद कर सकता हूं:\n• कुल बचत जानना\n• ऋण की जानकारी\n• सदस्यों की संख्या\n• समूह का कोष\n• हाल के लेनदेन\n\nबस पूछें!`
        : `I can help you with:\n• Total savings information\n• Loan details and status\n• Member count\n• Group corpus fund\n• Recent transactions\n\nJust ask!`;
    }

    // Specific member query
    const memberMatch = msg.match(/(?:about|ke bare|savings of|loan of)\s+(\w+)/i);
    if (memberMatch && members) {
      const searchName = memberMatch[1].toLowerCase();
      const member = members.find((m: any) => m.name.toLowerCase().includes(searchName));
      if (member) {
        return this.language === 'hi'
          ? `${member.name}:\n• बचत: ₹${(member.savingsBalance || 0).toLocaleString('en-IN')}\n• बकाया ऋण: ₹${(member.loanOutstanding || 0).toLocaleString('en-IN')}\n• उपस्थिति: ${member.attendanceRate || 0}%`
          : `${member.name}:\n• Savings: ₹${(member.savingsBalance || 0).toLocaleString('en-IN')}\n• Loan Outstanding: ₹${(member.loanOutstanding || 0).toLocaleString('en-IN')}\n• Attendance: ${member.attendanceRate || 0}%`;
      }
    }

    // Default response
    return this.language === 'hi'
      ? `मुझे समझ नहीं आया। कृपया बचत, ऋण, सदस्य, या लेनदेन के बारे में पूछें।`
      : `I'm not sure I understand. Please ask about savings, loans, members, or transactions.`;
  }
}

// Speech Recognition Hook (Browser Native)
const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Speech recognition not supported in this browser');
      return false;
    }

    setIsSupported(true);
    
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Changed to false for better mobile support
      recognitionRef.current.interimResults = true;
      recognitionRef.current.maxAlternatives = 1;
      isInitializedRef.current = true;
    }
    
    return true;
  }, []);

  useEffect(() => {
    initRecognition();
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [initRecognition]);

  const startListening = useCallback(async (language: string = 'en-IN') => {
    setError(null);
    
    // Re-initialize if needed
    if (!recognitionRef.current) {
      if (!initRecognition()) {
        toast.error('Speech recognition not available');
        return;
      }
    }
    
    recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    
    recognitionRef.current.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Show interim results for feedback
      if (interimTranscript) {
        setTranscript(interimTranscript);
      }
      
      if (finalTranscript) {
        setTranscript(finalTranscript);
        setIsListening(false);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          setError('Microphone blocked - tap to fix');
          toast((t) => (
            <div className="flex flex-col gap-2">
              <span className="font-bold">🎤 Microphone Access Needed</span>
              <span className="text-sm">Click the lock/camera icon in your browser's address bar and allow microphone access, then try again.</span>
            </div>
          ), { duration: 6000, icon: '⚠️' });
          break;
        case 'no-speech':
          setError('No speech detected');
          toast.error('No speech detected. Please speak clearly and try again.');
          break;
        case 'audio-capture':
          setError('No microphone found');
          toast.error('No microphone found. Please connect a microphone.');
          break;
        case 'network':
          setError('Network error');
          toast.error('Network error. Voice requires internet connection.');
          break;
        case 'aborted':
          // User aborted, no error message needed
          break;
        case 'service-not-allowed':
          setError('Voice service blocked');
          toast.error('Voice service is blocked. Please use Chrome or Edge browser.');
          break;
        default:
          setError(`Error: ${event.error}`);
          toast.error(`Voice error: ${event.error}`);
      }
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.onspeechend = () => {
      // Speech ended, recognition will process and call onend
    };

    try {
      // Abort any existing session first
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore
      }
      
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript('');
      console.log('Speech recognition started');
    } catch (startError: any) {
      console.error('Failed to start speech recognition:', startError);
      setError('Failed to start voice input');
      
      if (startError.message?.includes('already started')) {
        // Already running, try to stop and restart
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            recognitionRef.current.start();
            setIsListening(true);
          }, 100);
        } catch (e) {
          toast.error('Voice input busy. Please try again.');
        }
      } else {
        toast.error('Could not start voice input. Please try again.');
      }
    }
  }, [initRecognition]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore stop errors
      }
      setIsListening(false);
    }
  }, []);

  return { isListening, transcript, isSupported, error, startListening, stopListening, setTranscript };
};

// Text-to-Speech Hook (Browser Native)
const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string, language: string = 'en') => {
    if (!isEnabled || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.lang.startsWith(language === 'hi' ? 'hi' : 'en') && v.localService
    ) || voices.find(v => v.lang.startsWith(language === 'hi' ? 'hi' : 'en'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isEnabled]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const toggle = useCallback(() => {
    if (isSpeaking) {
      stop();
    }
    setIsEnabled(prev => !prev);
  }, [isSpeaking, stop]);

  return { isSpeaking, isEnabled, speak, stop, toggle };
};

export const AIChatBot: React.FC = () => {
  const { language } = useLanguage();
  const { members, loans, transactions, stats } = useData();
  const { currentUserRole } = useAuth();
  
  // UI States
  const [isOpen, setIsOpen] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', role: 'model', text: language === 'hi' 
      ? 'नमस्ते! मैं SHG Connect AI हूं। आज मैं आपकी समूह वित्त में कैसे मदद कर सकता हूं?' 
      : 'Namaste! I am SHG Connect AI. How can I help you with the group finances today?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiEngineRef = useRef<LocalAIEngine | null>(null);

  // Speech hooks
  const { isListening, transcript, isSupported: speechSupported, error: speechError, startListening, stopListening, setTranscript } = useSpeechRecognition();
  const { isSpeaking, isEnabled: ttsEnabled, speak, stop: stopSpeaking, toggle: toggleTTS } = useTextToSpeech();

  // Initialize AI Engine
  useEffect(() => {
    const context = { stats, members, loans, transactions };
    if (!aiEngineRef.current) {
      aiEngineRef.current = new LocalAIEngine(context, language);
    } else {
      aiEngineRef.current.updateContext(context);
    }
  }, [stats, members, loans, transactions, language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Handle voice transcript
  useEffect(() => {
    if (transcript && !isListening) {
      handleSendMessage(transcript);
      setTranscript('');
    }
  }, [transcript, isListening]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    const userText = text.trim();
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userText }]);
    setInput('');
    setIsTyping(true);

    // Simulate typing delay for natural feel
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

    try {
      const response = aiEngineRef.current?.generateResponse(userText) || 
        "I'm sorry, I couldn't process that request.";
      
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: response 
      }]);

      // Speak the response if in live mode or TTS is enabled
      if (isLiveMode && ttsEnabled) {
        speak(response, language);
      }
    } catch (error) {
      console.error("AI response error:", error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: "Sorry, I encountered an error. Please try again." 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => {
    handleSendMessage(input);
  };

  // Voice mode handlers
  const startVoiceMode = async () => {
    if (!speechSupported) {
      toast.error("Voice recognition is not supported in your browser. Please use Chrome or Edge.");
      return;
    }
    setIsLiveMode(true);
    setIsOpen(true);
    await startListening(language);
    toast.success("🎤 Voice mode active - Start speaking!");
  };

  const stopVoiceMode = () => {
    stopListening();
    stopSpeaking();
    setIsLiveMode(false);
  };

  const toggleListening = async () => {
    if (isListening) {
      stopListening();
    } else {
      await startListening(language);
    }
  };

  return (
    <>
      {/* Floating Action Buttons */}
      <div className="fixed bottom-24 left-6 z-40 flex flex-col gap-4">
        {/* Voice Mode Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={startVoiceMode}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 border border-white/10 bg-gradient-to-r from-red-500 to-pink-600 text-white
            ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}
          `}
        >
          <Mic size={24} />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0D0D0F] animate-pulse" />
        </motion.button>

        {/* Text Mode Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setIsOpen(true); setIsLiveMode(false); }}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 border border-white/10 bg-[#1C1C1E] text-blue-400
            ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}
          `}
        >
          <MessageCircle size={24} />
        </motion.button>
      </div>

      {/* Main Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`fixed z-50 bg-[#1C1C1E] border border-white/10 shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl transition-all duration-500
              ${isLiveMode 
                ? 'inset-0 md:inset-12 rounded-3xl' 
                : 'bottom-24 left-6 right-6 md:left-auto md:right-6 md:bottom-6 md:w-[380px] h-[500px] max-h-[70vh] rounded-3xl'
              }
            `}
          >
            {/* Header */}
            <div className="p-4 flex justify-between items-center shrink-0 border-b border-white/10 relative z-10">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isLiveMode ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {isLiveMode ? <Activity size={20} /> : <Bot size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">SHG Connect AI</h3>
                  <p className="text-[10px] text-white/60 flex items-center gap-1">
                    {isLiveMode ? 'Voice Mode (Offline)' : 'Financial Assistant (Offline)'}
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {/* TTS Toggle */}
                <button 
                  onClick={toggleTTS}
                  className={`p-2 rounded-full transition-colors ${ttsEnabled ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/40'}`}
                  title={ttsEnabled ? "Disable voice responses" : "Enable voice responses"}
                >
                  {ttsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
                <button 
                  onClick={() => { setIsOpen(false); if(isLiveMode) stopVoiceMode(); }} 
                  className="p-2 hover:bg-white/10 rounded-full text-white/80 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* CONTENT SWITCHER */}
            {isLiveMode ? (
              // --- LIVE VOICE UI ---
              <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-b from-red-900/20 to-transparent z-0" />
                
                {/* Central Orb */}
                <div className="relative z-10">
                  <motion.div 
                    animate={{ 
                      scale: isListening ? [1, 1.15, 1] : 1,
                      opacity: isListening ? 1 : 0.6
                    }}
                    transition={{ repeat: isListening ? Infinity : 0, duration: 1.5 }}
                    className={`w-40 h-40 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(236,72,153,0.5)] ${
                      isListening 
                        ? 'bg-gradient-to-tr from-red-500 to-pink-600' 
                        : isSpeaking 
                          ? 'bg-gradient-to-tr from-blue-500 to-purple-600'
                          : 'bg-gradient-to-tr from-gray-600 to-gray-700'
                    }`}
                  >
                    <div className="w-36 h-36 rounded-full bg-[#1C1C1E] flex items-center justify-center">
                      {isListening ? (
                        <Mic size={40} className="text-red-400 animate-pulse" />
                      ) : isSpeaking ? (
                        <Volume2 size={40} className="text-blue-400 animate-pulse" />
                      ) : (
                        <Mic size={40} className="text-white/50" />
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Status Text */}
                <div className="mt-10 text-center relative z-10">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : speechError ? 'Error' : 'Tap mic to speak'}
                  </h2>
                  <p className={`text-sm max-w-xs mx-auto ${speechError ? 'text-red-400' : 'text-white/50'}`}>
                    {speechError || transcript || 'Ask about savings, loans, or meeting schedules.'}
                  </p>
                </div>

                {/* Recent Messages in Voice Mode */}
                {messages.length > 1 && (
                  <div className="absolute top-20 left-4 right-4 max-h-32 overflow-y-auto">
                    <div className="bg-black/40 rounded-xl p-3 text-sm text-white/70">
                      <p className="font-medium text-white/90 mb-1">Last response:</p>
                      <p>{messages[messages.length - 1].text}</p>
                    </div>
                  </div>
                )}

                {/* Control Buttons */}
                <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-6 z-20">
                  <button 
                    onClick={toggleListening}
                    className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 ${
                      isListening 
                        ? 'bg-red-600 hover:bg-red-500 text-white' 
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {isListening ? <MicOff size={28} /> : <Mic size={28} />}
                  </button>
                  <button 
                    onClick={stopVoiceMode}
                    className="w-16 h-16 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                  >
                    <PhoneOff size={28} />
                  </button>
                </div>
              </div>
            ) : (
              // --- TEXT CHAT UI ---
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20 scroll-smooth">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div 
                        className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap
                        ${msg.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-br-none' 
                          : 'bg-white/10 text-white/90 rounded-bl-none border border-white/5'}`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white/5 p-3 rounded-2xl rounded-bl-none border border-white/5 flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 bg-white/5 border-t border-white/10 shrink-0">
                  <div className="relative flex items-center gap-2">
                    {/* Voice Input Button */}
                    {speechSupported && (
                      <button
                        onClick={toggleListening}
                        className={`p-3 rounded-xl transition-colors ${
                          isListening 
                            ? 'bg-red-500 text-white animate-pulse' 
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                      </button>
                    )}
                    <input
                      value={isListening ? transcript : input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder={isListening ? "Listening..." : "Type a message..."}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50"
                      disabled={isListening}
                    />
                    <button 
                      onClick={handleSend}
                      disabled={!input.trim() || isTyping || isListening}
                      className="absolute right-1.5 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50"
                    >
                      {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
