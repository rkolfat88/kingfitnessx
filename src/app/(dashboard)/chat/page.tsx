import { createClient } from '@/lib/supabase/server'
import { ChatInterface } from '@/components/chat/chat-interface'
import { ChatDisclaimer } from '@/components/chat/chat-disclaimer'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="chat-height flex flex-col">
      <div className="px-4 sm:px-6 py-4 border-b border-[var(--border)]">
        <h1 className="text-xl font-bold text-white">AI Coach</h1>
        <p className="text-gray-500 text-sm mt-0.5">Your personal transformation advisor</p>
      </div>
      <ChatDisclaimer />
      <div className="flex-1 overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  )
}
