import { createClient } from '@/lib/supabase/server'
import { ChatInterface } from '@/components/chat/chat-interface'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="h-screen flex flex-col pt-0">
      <div className="p-6 border-b border-[var(--border)] pt-6 lg:pt-6">
        <h1 className="text-xl font-bold text-white">AI Coach</h1>
        <p className="text-gray-500 text-sm mt-0.5">Your personal transformation advisor</p>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  )
}
