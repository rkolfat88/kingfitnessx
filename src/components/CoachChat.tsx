import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Brain } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
}

const QUICK_REPLIES = [
  'Lower back is tight today',
  'Should I eat carbs before my session?',
  'Explain what RPE 7 feels like',
  'How does poor sleep change today\'s plan?',
];

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function CoachChatScreen() {
  useAuth();
  const [messages, setMessages] = useState<Message[]>([{
    id: 'welcome',
    sender: 'coach',
    text: "I'm Coach King. Tell me what's going on — training, nutrition, recovery, or anything on your mind.",
    timestamp: now(),
  }]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isThinking) return;

    const userMsg: Message = { id: `u-${Date.now()}`, sender: 'user', text, timestamp: now() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const history = messages.slice(-10).map(m => ({ sender: m.sender, text: m.text }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ message: text, history }),
      });

      const data = await res.json();
      const reply = res.ok ? (data.reply ?? 'No response.') : (data.error ?? 'Something went wrong.');

      setMessages(prev => [...prev, { id: `c-${Date.now()}`, sender: 'coach', text: reply, timestamp: now() }]);
    } catch {
      setMessages(prev => [...prev, {
        id: `e-${Date.now()}`,
        sender: 'coach',
        text: 'Connection issue. Check your network and try again.',
        timestamp: now(),
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText.trim());
  };

  return (
    <div className="min-h-screen bg-[#000000] pb-24 flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-5 pt-12 pb-4 flex items-center gap-3 border-b border-[#262626]">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-[#CAFF40]/10 border-2 border-[#CAFF40] flex items-center justify-center font-black text-[#CAFF40] text-lg shadow-[0_0_12px_rgba(201,168,76,0.25)]">
            K
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#22C55E] border-2 border-[#000000]" />
        </div>
        <div>
          <h2 className="text-base font-black text-[#FFFFFF] leading-none">Coach King</h2>
          <p className="text-[9px] font-bold text-[#22C55E] uppercase tracking-widest mt-0.5">● Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map(msg => {
          const isUser = msg.sender === 'user';
          return (
            <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end ml-auto' : 'items-start mr-auto'} max-w-[85%]`}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`text-[8px] font-mono tracking-wider font-extrabold uppercase ${isUser ? 'text-[#A0A0A0]' : 'text-[#CAFF40]'}`}>
                  {isUser ? 'YOU' : 'COACH KING'}
                </span>
                <span className="text-[8px] font-mono text-[#5C5C5C]">{msg.timestamp}</span>
              </div>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                isUser
                  ? 'bg-[#CAFF40] text-[#000000] font-bold rounded-tr-none'
                  : 'bg-[#0D0D0D] text-[#FFFFFF] border border-[#262626] rounded-tl-none'
              }`}>
                <p className="whitespace-pre-line">{msg.text}</p>
              </div>
            </div>
          );
        })}

        {isThinking && (
          <div className="flex flex-col items-start max-w-[85%] mr-auto">
            <span className="text-[8px] font-mono tracking-wider font-extrabold text-[#CAFF40] uppercase mb-1">COACH KING</span>
            <div className="bg-[#0D0D0D] border border-[#262626] rounded-2xl rounded-tl-none px-4 py-3 text-xs text-[#CAFF40]/80 font-mono flex items-center gap-2">
              <Brain className="w-3.5 h-3.5 animate-spin" />
              <span>Reading your signals...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick replies */}
      <div className="shrink-0 px-3 py-2 flex gap-2 overflow-x-auto border-t border-[#262626]">
        {QUICK_REPLIES.map((reply, i) => (
          <button
            key={i}
            onClick={() => sendMessage(reply)}
            disabled={isThinking}
            className="shrink-0 px-3 py-1.5 bg-[#0D0D0D] hover:bg-[#141414] border border-[#262626] text-[10px] text-[#A0A0A0] hover:text-[#CAFF40] rounded-full transition font-bold tracking-wide disabled:opacity-40"
          >
            {reply}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="shrink-0 px-5 py-3 border-t border-[#262626] flex items-center gap-2 bg-[#000000]">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            disabled={isThinking}
            placeholder="Ask Coach King..."
            className="w-full pl-4 pr-10 py-3 bg-[#0D0D0D] border border-[#262626] text-[#FFFFFF] text-sm rounded-full placeholder:text-[#5C5C5C] focus:outline-none focus:border-[#CAFF40]/50 transition"
          />
          <Sparkles className="absolute right-3.5 top-3.5 w-4 h-4 text-[#CAFF40]/40" />
        </div>
        <button
          type="submit"
          disabled={isThinking || !inputText.trim()}
          className="w-10 h-10 rounded-full bg-[#CAFF40] hover:bg-[#A8D930] disabled:bg-[#262626] disabled:text-[#5C5C5C] text-black flex items-center justify-center transition shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
