'use client'

import { useEffect, useState } from 'react'
import { useUserSync } from '@/hooks/useUserSync'
import { useSocket } from '@/hooks/useSocket'
import { Sidebar } from '@/components/chat/Sidebar'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { ContactsPanel } from '@/components/chat/ContactsPanel'
import { UserProfile } from '@/components/chat/UserProfile'

export default function ChatPage() {
  const { user, isLoaded } = useUserSync() // Use sync hook instead
  const socket = useSocket()
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<'chat' | 'contacts' | 'profile'>('chat')

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-300 dark:border-gray-700 flex flex-col">
        <Sidebar
          selectedConversation={selectedConversation}
          onSelectConversation={setSelectedConversation}
          activePanel={activePanel}
          onPanelChange={setActivePanel}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {activePanel === 'chat' && (
          <ChatWindow
            conversationId={selectedConversation}
            socket={socket}
          />
        )}
        {activePanel === 'contacts' && (
          <ContactsPanel 
            onSelectConversation={(id) => {
              setSelectedConversation(id)
              setActivePanel('chat')
            }} 
          />
        )}
        {activePanel === 'profile' && (
          <UserProfile />
        )}
      </div>
    </div>
  )
}
