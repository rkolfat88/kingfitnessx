'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, isTextUIPart } from 'ai'
import { useEffect, useRef, useState, useMemo } from 'react'
import { MessageBubble, TypingIndicator } from './message-bubble'
import { ChatInput } from './chat-input'
import type { Message } from '@/types'

const SUGGESTED_PROMPTS = [
  "What should I eat today?",
  "Show me today's workout",
  "How do I increase my bench press?",
  "Am I making good progress?",
  "What supplements should I take?",
  "How do I improve my recovery?",
  "Optimize my sleep for gains",
  "Build a cutting diet plan",
]

export function ChatInterface() {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')

  const [injectedMessages, setInjectedMessages] = useState<Array<{ id: string } & Message>>([])

  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/chat' }), [])

  const { messages, sendMessage, status } = useChat({
    transport,
    onError: (error: Error) => {
      const msg = error.message ?? ''
      if (msg.includes('429') || msg.includes('limit_reached') || msg.includes('limit reached')) {
        setInjectedMessages(prev => [...prev, {
          id: `injected-${Date.now()}`,
          role: 'assistant',
          content: '**You\'ve used your 3 free messages today.**\n\nUpgrade to King Pro for unlimited AI coaching, workout plans, and all specialist agents.\n\n[**Upgrade to King Pro →**](/upgrade?reason=limit)',
        }])
      } else if (msg.includes('403') || msg.includes('upgrade_required')) {
        window.location.href = '/upgrade?reason=feature'
      }
    },
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  function getMessageText(msg: (typeof messages)[number]): string {
    return msg.parts
      .filter(isTextUIPart)
      .map(p => p.text)
      .join('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  function handleSuggested(prompt: string) {
    sendMessage({ text: prompt })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center mb-2.5">
              <span className="text-xl">👑</span>
            </div>
            <h2 className="text-base font-bold text-white mb-1">Ask Your Coach</h2>
            <p className="text-[#505050] text-xs mb-6 max-w-xs">
              Elite AI coaching on training, nutrition, recovery, and mindset.
            </p>
            <div className="grid grid-cols-2 gap-3 w-full px-4">
              {SUGGESTED_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => handleSuggested(prompt)}
                  className="px-3 py-2.5 text-xs text-left bg-[#161616] border border-[#242424] text-[#909090] rounded-xl hover:border-[#C9A84C]/30 hover:text-[#C9A84C] transition-all cursor-pointer leading-snug"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={{
              role: msg.role as 'user' | 'assistant',
              content: getMessageText(msg),
            }}
          />
        ))}

        {injectedMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={{ role: msg.role, content: msg.content }}
          />
        ))}

        {isLoading && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-[#242424] bg-black/80 backdrop-blur flex-shrink-0">
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
