import React, { useState, useRef, useEffect } from 'react';
import { Send, Check, Dumbbell, Sparkles, Brain } from 'lucide-react';
import { Message } from '../types';

interface CoachChatProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isThinking: boolean;
}

export function CoachChat({ messages, onSendMessage, isThinking }: CoachChatProps) {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const QUICK_REPLIES = [
    "Lower back is tight today",
    "Should I eat carbs before push set?",
    "Explain what an RPE 7 target feels like",
    "How does WHOOP sleep score alter today's load?"
  ];

  return (
    <div className="flex flex-col h-full text-left font-sans">
      
      {/* Header of Screen 3 */}
      <div className="bg-[#1A1A1A] p-4 border border-gold-base/15 rounded-t-2xl flex items-center gap-3">
        {/* Glowing gold avatar */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-[#C9A84C]/10 border-2 border-[#C9A84C] flex items-center justify-center font-black text-gold-base text-lg tracking-tighter shadow-[0_0_12px_rgba(201,168,76,0.25)]">
            K
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[#1A1A1A]"></span>
        </div>

        <div className="flex-1">
          <h3 className="text-base font-extrabold text-[#F0F0F0] leading-none font-display flex items-center gap-1.5">
            Coach King
            <span className="text-[8px] bg-gold-base/10 text-gold-base px-1.5 py-0.5 rounded font-mono font-bold">ATHLETIC AI</span>
          </h3>
          <p className="text-[9px] font-extrabold text-[#10B981] uppercase tracking-widest mt-1 font-mono flex items-center gap-1">
            <span>●</span> AI PERSONAL TRAINER ONLINE
          </p>
        </div>
      </div>

      {/* Messages Thread list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[460px] bg-[#0c0c0c] border-x border-gold-base/15">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] ${isUser ? 'ml-auto' : 'mr-auto'} animate-fade-in`}
            >
              {/* Sender label and timing info */}
              <div className="flex items-center gap-1.5 mb-1">
                {!isUser && (
                  <span className="text-[8px] font-mono tracking-wider font-extrabold text-gold-base uppercase">
                    COACH KING
                  </span>
                )}
                {isUser && (
                  <span className="text-[8px] font-mono tracking-wider font-extrabold text-[#909090] uppercase">
                    YOU
                  </span>
                )}
                <span className="text-[8px] font-mono text-[#505050] font-bold">{msg.timestamp}</span>
              </div>

              {/* Message Bubble Body */}
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-normal shadow-sm ${
                  isUser
                    ? 'bg-[#C9A84C] text-[#080808] font-bold rounded-tr-none'
                    : 'bg-[#1A1A1A] text-[#E0E0E0] border border-white/5 rounded-tl-none font-medium'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
              </div>
            </div>
          );
        })}

        {/* Typing thinking indicator */}
        {isThinking && (
          <div className="flex flex-col items-start max-w-[85%] mr-auto animate-pulse">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[8px] font-mono tracking-wider font-extrabold text-gold-base uppercase">COACH KING</span>
              <span className="text-[8px] font-mono text-gold-base font-bold animate-ping">●</span>
            </div>
            <div className="bg-[#1A1A1A] text-gold-base/80 border border-gold-base/20 rounded-2xl rounded-tl-none px-4 py-3 text-xs font-mono flex items-center gap-2">
              <Brain className="w-3.5 h-3.5 text-gold-base animate-spin" />
              <span>Analyzing biomechanics & bio-wearables data...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Bottom suggestions quick replies */}
      <div className="bg-[#0c0c0c] border-x border-gold-base/15 px-3 py-2 flex gap-1.5 overflow-x-auto select-none no-scrollbar whitespace-nowrap">
        {QUICK_REPLIES.map((reply, i) => (
          <button
            key={i}
            onClick={() => {
              if (!isThinking) {
                onSendMessage(reply);
              }
            }}
            className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#262626] border border-white/5 text-[10px] text-[#A0A0A0] hover:text-gold-light rounded-full transition duration-150 font-bold tracking-wide shrink-0"
          >
            {reply}
          </button>
        ))}
      </div>

      {/* Message input text box */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-[#1A1A1A] rounded-b-2xl border-x border-b border-gold-base/15 flex items-center gap-2"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isThinking}
            placeholder="Message King..."
            className="w-full pl-4 pr-10 py-3 bg-[#080808] border border-white/10 text-[#F0F0F0] text-sm rounded-full placeholder-[#606060] focus:outline-none focus:border-gold-base/50 focus:ring-1 focus:ring-gold-base/20 transition duration-150"
          />
          <span className="absolute right-3.5 top-3 text-gold-base/40">
            <Sparkles className="w-4 h-4" />
          </span>
        </div>
        <button
          type="submit"
          disabled={isThinking || !inputText.trim()}
          className="w-10 h-10 rounded-full bg-[#C9A84C] hover:bg-[#E8C76A] disabled:bg-[#333] disabled:text-[#666] text-[#080808] flex items-center justify-center transition duration-150 shrink-0"
        >
          <Send className="w-4 h-4 stroke-3 rotate-0" />
        </button>
      </form>
    </div>
  );
}
