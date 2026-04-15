import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  ArrowLeft, 
  Send, 
  Image, 
  Mic, 
  MicOff,
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  Smile,
  Paperclip,
  X,
  Users,
  Search
} from 'lucide-react';
import { useHaptics } from '../hooks/useNative';
import { ChatMessage, ChatRoom } from '../types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface ChatProps {
  onBack: () => void;
}

const mockRooms: ChatRoom[] = [
  {
    id: 'group',
    name: 'SHG Group Chat',
    type: 'group',
    participants: ['u1', 'u2', 'u3', 'u4', 'u5'],
    lastMessage: {
      id: 'm1',
      senderId: 'u2',
      senderName: 'Priya',
      message: 'See you all at the meeting tomorrow!',
      timestamp: '2026-01-29T14:30:00',
      type: 'text',
      readBy: ['u1', 'u2']
    },
    unreadCount: 3,
    createdAt: '2025-01-01'
  },
  {
    id: 'dm1',
    name: 'Lakshmi',
    type: 'direct',
    participants: ['current-user', 'u1'],
    lastMessage: {
      id: 'm2',
      senderId: 'u1',
      senderName: 'Lakshmi',
      message: 'Your loan has been approved!',
      timestamp: '2026-01-29T10:00:00',
      type: 'text',
      readBy: ['u1']
    },
    unreadCount: 1,
    createdAt: '2025-06-15'
  }
];

const mockMessages: ChatMessage[] = [
  {
    id: '1',
    senderId: 'u1',
    senderName: 'Lakshmi',
    message: 'Good morning everyone! 🙏',
    timestamp: '2026-01-29T09:00:00',
    type: 'text',
    readBy: ['u1', 'u2', 'u3']
  },
  {
    id: '2',
    senderId: 'u2',
    senderName: 'Priya',
    message: 'Good morning! Ready for the meeting today?',
    timestamp: '2026-01-29T09:05:00',
    type: 'text',
    readBy: ['u1', 'u2']
  },
  {
    id: '3',
    senderId: 'current-user',
    senderName: 'You',
    message: 'Yes, I have prepared the monthly report',
    timestamp: '2026-01-29T09:10:00',
    type: 'text',
    readBy: ['current-user', 'u1', 'u2']
  },
  {
    id: '4',
    senderId: 'u3',
    senderName: 'Meena',
    message: 'Great! Can you share it in the group?',
    timestamp: '2026-01-29T09:15:00',
    type: 'text',
    readBy: ['u3']
  },
  {
    id: '5',
    senderId: 'u1',
    senderName: 'Lakshmi',
    message: 'Reminder: Please bring your savings contribution. We need to collect ₹5000 from each member.',
    timestamp: '2026-01-29T10:00:00',
    type: 'text',
    readBy: ['u1', 'u2', 'u3']
  },
  {
    id: '6',
    senderId: 'u2',
    senderName: 'Priya',
    message: 'See you all at the meeting tomorrow!',
    timestamp: '2026-01-29T14:30:00',
    type: 'text',
    readBy: ['u1', 'u2']
  }
];

export const Chat: React.FC<ChatProps> = ({ onBack }) => {
  const { tap, notify } = useHaptics();
  const { user } = useAuth();
  
  const [rooms, setRooms] = useState<ChatRoom[]>(mockRooms);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const currentUserId = user?.id || 'current-user';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedRoom) return;
    
    tap('light');
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUserId,
      senderName: user?.name || 'You',
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      type: 'text',
      readBy: [currentUserId]
    };

    setMessages([...messages, message]);
    setNewMessage('');
    
    // Update room's last message
    setRooms(rooms.map(r => 
      r.id === selectedRoom.id 
        ? { ...r, lastMessage: message }
        : r
    ));

    // Simulate typing indicator from others
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        // Simulate reply
        const reply: ChatMessage = {
          id: (Date.now() + 1).toString(),
          senderId: 'u1',
          senderName: 'Lakshmi',
          message: 'Thanks for the update! 👍',
          timestamp: new Date().toISOString(),
          type: 'text',
          readBy: ['u1']
        };
        setMessages(prev => [...prev, reply]);
        notify('success');
      }, 2000);
    }, 1000);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getMessageStatus = (message: ChatMessage) => {
    if (message.senderId !== currentUserId) return null;
    if (message.readBy.length > 1) return 'read';
    return 'sent';
  };

  // Room List View
  if (!selectedRoom) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-background pb-24"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-white/5">
          <div className="px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => { tap('light'); onBack(); }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Messages</h1>
              <p className="text-xs text-white/50">{rooms.length} conversations</p>
            </div>
          </div>

          {/* Search */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Room List */}
        <div className="px-4 py-2">
          {rooms.map((room, index) => (
            <motion.button
              key={room.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => { tap('light'); setSelectedRoom(room); }}
              className="w-full p-3 rounded-2xl flex items-center gap-3 hover:bg-white/5 transition-colors"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                room.type === 'group' 
                  ? 'bg-gradient-to-br from-primary to-purple-600' 
                  : 'bg-gradient-to-br from-green-500 to-emerald-600'
              }`}>
                {room.type === 'group' ? (
                  <Users className="w-6 h-6 text-white" />
                ) : (
                  <span className="text-xl font-bold text-white">
                    {room.name.charAt(0)}
                  </span>
                )}
              </div>
              
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold truncate">{room.name}</h3>
                  <span className="text-xs text-white/40">
                    {room.lastMessage && formatTime(room.lastMessage.timestamp)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-sm text-white/50 truncate">
                    {room.lastMessage?.senderName}: {room.lastMessage?.message}
                  </p>
                  {room.unreadCount > 0 && (
                    <span className="ml-2 w-5 h-5 rounded-full bg-primary text-xs flex items-center justify-center">
                      {room.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    );
  }

  // Chat View
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen bg-background flex flex-col"
    >
      {/* Chat Header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-white/5">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => { tap('light'); setSelectedRoom(null); }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            selectedRoom.type === 'group' 
              ? 'bg-gradient-to-br from-primary to-purple-600' 
              : 'bg-gradient-to-br from-green-500 to-emerald-600'
          }`}>
            {selectedRoom.type === 'group' ? (
              <Users className="w-5 h-5 text-white" />
            ) : (
              <span className="text-lg font-bold text-white">
                {selectedRoom.name.charAt(0)}
              </span>
            )}
          </div>
          
          <div className="flex-1">
            <h2 className="font-semibold">{selectedRoom.name}</h2>
            <p className="text-xs text-white/50">
              {selectedRoom.type === 'group' 
                ? `${selectedRoom.participants.length} members`
                : 'Online'
              }
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message, index) => {
          const isOwn = message.senderId === currentUserId;
          const showDate = index === 0 || 
            formatDate(messages[index - 1].timestamp) !== formatDate(message.timestamp);
          const status = getMessageStatus(message);
          
          return (
            <React.Fragment key={message.id}>
              {showDate && (
                <div className="text-center">
                  <span className="text-xs text-white/40 bg-white/5 px-3 py-1 rounded-full">
                    {formatDate(message.timestamp)}
                  </span>
                </div>
              )}
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${isOwn ? 'order-2' : ''}`}>
                  {!isOwn && selectedRoom.type === 'group' && (
                    <p className="text-xs text-white/50 mb-1 ml-3">{message.senderName}</p>
                  )}
                  
                  <div className={`px-4 py-2.5 rounded-2xl ${
                    isOwn 
                      ? 'bg-primary text-white rounded-br-md' 
                      : 'bg-surface text-white rounded-bl-md'
                  }`}>
                    <p className="text-sm">{message.message}</p>
                    
                    <div className={`flex items-center gap-1 mt-1 ${
                      isOwn ? 'justify-end' : 'justify-start'
                    }`}>
                      <span className="text-[10px] opacity-60">
                        {formatTime(message.timestamp)}
                      </span>
                      {status === 'read' && (
                        <CheckCheck className="w-3 h-3 text-blue-300" />
                      )}
                      {status === 'sent' && (
                        <Check className="w-3 h-3 opacity-60" />
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </React.Fragment>
          );
        })}
        
        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="bg-surface px-4 py-2.5 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-background border-t border-white/5 p-4 safe-bottom">
        <div className="flex items-center gap-2">
          <button className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10">
            <Paperclip className="w-5 h-5" />
          </button>
          
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="w-full bg-surface border border-white/10 rounded-full py-2.5 px-4 pr-10 text-white focus:outline-none focus:border-primary"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2">
              <Smile className="w-5 h-5 text-white/40" />
            </button>
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className={`p-2.5 rounded-xl transition-all ${
              newMessage.trim()
                ? 'bg-primary hover:bg-primary/80'
                : 'bg-white/5'
            }`}
          >
            <Send className={`w-5 h-5 ${newMessage.trim() ? 'text-white' : 'text-white/40'}`} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
