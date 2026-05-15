import { Crown } from 'lucide-react'
import { ChatInterface } from '@/components/chat/chat-interface'
import { ChatDisclaimer } from '@/components/chat/chat-disclaimer'

export default async function ChatPage() {
  return (
    <div className="chat-height flex flex-col">

      {/* HEADER */}
      <div className="px-4 py-4 border-b border-[#242424] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center">
            <Crown className="w-4 h-4 text-[#C9A84C]" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">King AI Coach</h1>
            <p className="text-xs text-[#505050]">Your personal transformation advisor</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400">6 agents active</span>
        </div>
      </div>

      <ChatDisclaimer />

      <div className="flex-1 overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  )
}
