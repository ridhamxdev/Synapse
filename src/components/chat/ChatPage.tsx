'use client'

import { useEffect, useState } from 'react'
import { useUserSync } from '@/hooks/useUserSync'
import { useSocket } from '@/hooks/useSocket'
import { Sidebar } from '@/components/chat/Sidebar'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { ContactsPanel } from '@/components/chat/ContactsPanel'
import { UserProfile } from '@/components/chat/UserProfile'

export function ChatPage() {
  const { user, isLoaded } = useUserSync()
  const { socket, isConnected } = useSocket()
  const [selectedConversation, setSelectedConversation] = useState<{
    id: string
    name?: string
    imageUrl?: string
    isOnline?: boolean
    lastSeen?: string
  } | null>(null)
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
      <div className="w-80 border-r border-gray-300 dark:border-gray-700 flex flex-col">
        <Sidebar
          selectedConversation={selectedConversation?.id || null}
          onSelectConversation={(id) => {
            if (id) {
              setSelectedConversation({
                id,
                name: 'Conversation',
                imageUrl: undefined,
                isOnline: false,
                lastSeen: undefined
              })
            } else {
              setSelectedConversation(null)
            }
          } }
          activePanel={activePanel}
          onPanelChange={setActivePanel} conversations={[]} isLoadingConversations={false} isConnected={isConnected}   />
      </div>
      <div className="flex-1 flex flex-col">
        {activePanel === 'chat' && selectedConversation && (
          <ChatWindow
            conversation={selectedConversation}
            socket={socket} 
            isConnected={isConnected} 
          />
        )}
        {activePanel === 'chat' && !selectedConversation && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a conversation to start chatting</p>
          </div>
        )}
        {activePanel === 'contacts' && (
          <ContactsPanel 
            onSelectConversation={(id) => {
              if (id) {
                setSelectedConversation({
                  id,
                  name: 'Contact',
                  imageUrl: undefined,
                  isOnline: false,
                  lastSeen: undefined
                })
                setActivePanel('chat')
              }
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