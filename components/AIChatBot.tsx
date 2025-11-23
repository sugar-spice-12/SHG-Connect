import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2, Bot, RefreshCw, Mic, MicOff, PhoneOff, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI, Chat, LiveServerMessage, Modality } from "@google/genai";
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// API Key - Update this with your key or use environment variable
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyCYQbhOiaNHs4t8JZRregjJqxS-_7cz6HI";

// --- Audio Helpers (Encoding/Decoding) ---
function base64ToUint8Array(base64String: string) {
  const binaryString = atob(base64String);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const AIChatBot: React.FC = () => {
  const { language } = useLanguage();
  const { members, loans, transactions, stats } = useData();
  const { currentUserRole } = useAuth();
  
  // UI States
  const [isOpen, setIsOpen] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', role: 'model', text: 'Namaste! I am SHG Connect AI. How can I help you with the group finances today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  // Text Chat Refs
  const chatSession = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Live Audio Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const liveSessionPromise = useRef<Promise<any> | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Cleanup on Unmount (Logout)
  useEffect(() => {
    return () => {
        stopLiveSession();
    };
  }, []);

  // --- Context Generation ---
  const getSystemContext = useMemo(() => {
    const currentUser = currentUserRole === 'Member' ? members[0] : null;
    const userIdentityContext = currentUser 
        ? `YOU ARE SPEAKING TO: ${currentUser.name} (Member ID: ${currentUser.id}).`
        : `YOU ARE SPEAKING TO: The Group Leader.`;

    const contextData = {
        groupStats: stats,
        members: members.map(m => ({
            name: m.name,
            savings: m.savingsBalance,
            loanDue: m.loanOutstanding,
            attendance: m.attendanceRate + '%'
        })),
        activeLoans: loans.filter(l => l.status === 'Active').length
    };

    return `You are SHG Connect AI, a helpful financial assistant for a Self-Help Group.
    ${userIdentityContext}
    Current Data: ${JSON.stringify(contextData)}
    Keep responses concise, encouraging, and natural. Speak clearly.`;
  }, [members, loans, stats, currentUserRole]);

  // --- Text Chat Logic ---
  const initTextChat = () => {
    if (!GEMINI_API_KEY) {
        toast.error("API Key Missing");
        return;
    }
    
    try {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        chatSession.current = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: { 
            systemInstruction: getSystemContext
          }
        });
        console.log("✅ Text chat initialized with gemini-2.5-flash");
    } catch (error) {
        console.error("❌ Failed to initialize text chat:", error);
        toast.error("Failed to initialize chat");
    }
  };

  useEffect(() => {
    if (isOpen && !isLiveMode && !chatSession.current) {
        initTextChat();
    }
  }, [isOpen, isLiveMode, getSystemContext]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userText }]);
    setInput('');
    setIsTyping(true);

    try {
       if (!chatSession.current) {
           initTextChat();
           // Wait a bit for initialization
           await new Promise(resolve => setTimeout(resolve, 500));
       }
       
       if (chatSession.current) {
           console.log("📤 Sending message:", userText);
           const result = await chatSession.current.sendMessage({ message: userText });
           console.log("📥 Received response:", result.text);
           setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: result.text }]);
       } else {
           throw new Error("Chat session not initialized");
       }
    } catch (error: any) {
        console.error("❌ Chat error:", error);
        console.error("Error details:", error.message, error.stack);
        
        // Handle specific error types
        if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
            setMessages(prev => [...prev, { 
                id: Date.now().toString(), 
                role: 'model', 
                text: `⚠️ Rate limit reached. The API key has exceeded its quota. Please try again later or upgrade your API plan.` 
            }]);
            toast.error("Rate limit exceeded. Please wait and try again.");
        } else {
            // Try to reinitialize on other errors
            chatSession.current = null;
            
            setMessages(prev => [...prev, { 
                id: Date.now().toString(), 
                role: 'model', 
                text: `Sorry, I encountered an error: ${error.message || 'Connection failed'}. Please try again.` 
            }]);
        }
    } finally {
        setIsTyping(false);
    }
  };

  // --- Live Audio Logic ---
  const startLiveSession = async () => {
    if (!GEMINI_API_KEY) {
        toast.error("API Key Missing. Please add your Gemini API key.");
        return;
    }
    
    setIsLiveMode(true);
    setIsOpen(true);
    setConnectionStatus('connecting');

    try {
        // 1. Setup Audio Input
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioStream(stream);
        
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        audioContextRef.current = inputCtx;
        
        // 2. Setup Audio Output
        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        outputAudioContextRef.current = outputCtx;
        nextStartTimeRef.current = outputCtx.currentTime;

        // 3. Connect to Gemini Live
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        
        console.log("🎤 Connecting to Gemini Live API...");
        
        liveSessionPromise.current = ai.live.connect({
            model: 'gemini-2.0-flash-exp',
            config: {
                responseModalities: [Modality.AUDIO],
                systemInstruction: getSystemContext
            },
            callbacks: {
                onopen: () => {
                    console.log("✅ Live session connected");
                    setConnectionStatus('connected');
                    toast.success("🎤 Voice mode active - Start speaking!");
                    
                    // Stream audio from the microphone to the model
                    const source = inputCtx.createMediaStreamSource(stream);
                    const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                    inputProcessorRef.current = processor;

                    // Only send audio if there's actual sound (voice activity detection)
                    let isProcessing = false;
                    
                    processor.onaudioprocess = (e) => {
                        if (isProcessing) return; // Prevent flooding
                        
                        const inputData = e.inputBuffer.getChannelData(0);
                        
                        // Calculate volume to detect voice
                        let sum = 0;
                        for (let i = 0; i < inputData.length; i++) {
                            sum += inputData[i] * inputData[i];
                        }
                        const volume = Math.sqrt(sum / inputData.length);
                        
                        // Only send if volume is above threshold (voice detected)
                        if (volume > 0.01) {
                            isProcessing = true;
                            
                            // Convert Float32 to Int16 for PCM
                            const pcmData = new Int16Array(inputData.length);
                            for (let i = 0; i < inputData.length; i++) {
                                pcmData[i] = inputData[i] * 0x7fff;
                            }
                            
                            const base64Audio = uint8ArrayToBase64(new Uint8Array(pcmData.buffer));
                            
                            // Send audio data to active session
                            liveSessionPromise.current?.then(session => {
                                if (session && session.sendRealtimeInput) {
                                    session.sendRealtimeInput({
                                        media: {
                                            mimeType: 'audio/pcm;rate=16000',
                                            data: base64Audio
                                        }
                                    });
                                }
                            }).catch(err => {
                                console.error("❌ Error sending audio:", err);
                            }).finally(() => {
                                setTimeout(() => isProcessing = false, 100); // Reset after 100ms
                            });
                        }
                    };
                    
                    source.connect(processor);
                    processor.connect(inputCtx.destination);
                },
                onmessage: async (msg: LiveServerMessage) => {
                    console.log("📥 Received message from AI");
                    const modelAudio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (modelAudio && outputAudioContextRef.current) {
                        const ctx = outputAudioContextRef.current;
                        const audioBytes = base64ToUint8Array(modelAudio);
                        
                        // Decode PCM 24kHz
                        const audioBuffer = ctx.createBuffer(1, audioBytes.length / 2, 24000);
                        const channelData = audioBuffer.getChannelData(0);
                        const dataView = new DataView(audioBytes.buffer);
                        
                        for (let i = 0; i < audioBytes.length / 2; i++) {
                            channelData[i] = dataView.getInt16(i * 2, true) / 32768.0;
                        }

                        const source = ctx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(ctx.destination);
                        
                        // Schedule playback
                        const startTime = Math.max(ctx.currentTime, nextStartTimeRef.current);
                        source.start(startTime);
                        nextStartTimeRef.current = startTime + audioBuffer.duration;
                    }
                },
                onclose: () => {
                    console.log("❌ Live session closed");
                    setConnectionStatus('disconnected');
                    // Don't auto-stop, just update status
                },
                onerror: (err) => {
                    console.error("❌ Live session error:", err);
                    
                    if (err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
                        toast.error("⚠️ API rate limit exceeded. Please wait 1 minute and try again.");
                    } else {
                        toast.error("Connection error: " + (err.message || "Unknown error"));
                    }
                    // Don't auto-stop on error, let user decide
                    setConnectionStatus('disconnected');
                }
            }
        });

    } catch (err: any) {
        console.error("❌ Setup error:", err);
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
             toast.error("🎤 Microphone permission denied. Please allow access.");
        } else if (err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
             toast.error("⚠️ API rate limit exceeded. Please wait 1 minute and try again.");
        } else {
             toast.error("Failed to start voice session: " + (err.message || "Unknown error"));
        }
        setConnectionStatus('disconnected');
        setIsLiveMode(false);
    }
  };

  const stopLiveSession = () => {
    console.log("🛑 Stopping live session...");
    
    // Cleanup Audio Contexts
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
        outputAudioContextRef.current.close();
    }
    
    inputProcessorRef.current?.disconnect();
    audioStream?.getTracks().forEach(track => track.stop());
    
    // Reset State
    setAudioStream(null);
    setConnectionStatus('disconnected');
    setIsLiveMode(false);
    
    // Force close session logic
    liveSessionPromise.current = null;
  };

  return (
    <>
      {/* Floating Action Buttons */}
      <div className="fixed bottom-24 left-6 z-40 flex flex-col gap-4">
        {/* Voice Mode Button */}
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startLiveSession}
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
                           {isLiveMode ? 'Real-time Voice' : 'Financial Assistant'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { setIsOpen(false); if(isLiveMode) stopLiveSession(); }} className="p-2 hover:bg-white/10 rounded-full text-white/80 transition-colors">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* CONTENT SWITCHER */}
            {isLiveMode ? (
                // --- LIVE VOICE UI ---
                <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
                    {/* Background Effects */}
                    <div className="absolute inset-0 bg-gradient-to-b from-red-900/20 to-background z-0" />
                    
                    {/* Central Orb */}
                    <div className="relative z-10">
                         <motion.div 
                            animate={{ 
                                scale: connectionStatus === 'connected' ? [1, 1.1, 1] : 1,
                                opacity: connectionStatus === 'connected' ? 1 : 0.5
                            }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="w-40 h-40 rounded-full bg-gradient-to-tr from-red-500 to-pink-600 blur-md flex items-center justify-center shadow-[0_0_50px_rgba(236,72,153,0.5)]"
                         >
                             <div className="w-36 h-36 rounded-full bg-[#1C1C1E] flex items-center justify-center">
                                 <Mic size={40} className="text-white" />
                             </div>
                         </motion.div>
                         {connectionStatus === 'connecting' && (
                             <div className="absolute inset-0 flex items-center justify-center">
                                 <div className="w-48 h-48 border-2 border-white/10 border-t-red-500 rounded-full animate-spin" />
                             </div>
                         )}
                    </div>

                    <div className="mt-10 text-center relative z-10">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {connectionStatus === 'connecting' ? 'Connecting...' : 'Listening'}
                        </h2>
                        <p className="text-white/50 text-sm max-w-xs mx-auto">
                            Ask about savings, loans, or meeting schedules.
                        </p>
                    </div>

                    <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-6 z-20">
                        <button 
                            onClick={stopLiveSession}
                            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
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
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type a message..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50"
                            />
                            <button 
                                onClick={handleSend}
                                disabled={!input.trim() || isTyping}
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