'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, isTextUIPart } from 'ai'
import { useEffect, useRef, useState, useMemo } from 'react'
import { MessageBubble, TypingIndicator } from './message-bubble'
import { ChatInput } from './chat-input'

const SUGGESTED_PROMPTS = [
  "What should I eat today?",
  "Show me today's workout",
  "How do I increase my bench press?",
  "Am I making good progress?",
]

export function ChatInterface() {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')

  const [injectedMessages, setInjectedMessages] = useState<Array<{ id: string; role: 'assistant'; content: string }>>([])

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
      <div className="flex-1 overflow-y-auto p-6 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center pb-20">
            <div className="w-16 h-16 rounded-2xl bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center mb-4">
              <span className="text-2xl">👑</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">King AI Coach</h2>
            <p className="text-gray-500 text-sm mb-8 max-w-sm">
              Your elite transformation coach is ready. Ask anything about training, nutrition, or your progress.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTED_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => handleSuggested(prompt)}
                  className="px-4 py-2 text-sm bg-[var(--surface-2)] border border-[var(--border)] text-gray-300 rounded-full hover:border-[var(--gold)]/30 hover:text-[var(--gold)] transition-all cursor-pointer"
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
            role={msg.role as 'user' | 'assistant'}
            content={getMessageText(msg)}
          />
        ))}

        {injectedMessages.map((msg) => (
          <MessageBubble key={msg.id} role="assistant" content={msg.content} />
        ))}

        {isLoading && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-[var(--border)] bg-black/50 backdrop-blur">
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
