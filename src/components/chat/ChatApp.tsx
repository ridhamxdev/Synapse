'use client'

import { useEffect, useState } from 'react'
import { useUserSync } from '@/hooks/useUserSync'
import { useSocket } from '@/hooks/useSocket'
import { Sidebar } from '@/components/chat/Sidebar'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { ContactsPanel } from '@/components/chat/ContactsPanel'
import { UserProfile } from '@/components/chat/UserProfile'

export function ChatApp() {
  const { user, isLoaded } = useUserSync()
  const { socket, isConnected, connectionError } = useSocket()
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<'chat' | 'contacts' | 'profile'>('chat')

  // Load user's conversations on mount
  useEffect(() => {
    if (isLoaded && user) {
      loadUserConversations()
    }
  }, [isLoaded, user])

  const loadUserConversations = async () => {
    try {
      // FIXED: Correct endpoint
      const response = await fetch('/api/conversations')
      if (response.ok) {
        const data = await response.json()
        console.log('Loaded conversations:', data.conversations?.length || 0)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your chats...</p>
          {connectionError && (
            <p className="text-red-500 text-sm mt-2">Connection Error: {connectionError}</p>
          )}
        </div>
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
