'use client'

import { useEffect, useState, useCallback } from 'react'
import { useUserSync } from '@/hooks/useUserSync'
import { useSocket } from '@/hooks/useSocket'
import { Sidebar } from '@/components/chat/Sidebar'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { ContactsPanel } from '@/components/chat/ContactsPanel'
import { UserProfile } from '@/components/chat/UserProfile'

interface Conversation {
  id: string
  name: string
  imageUrl?: string
  lastMessage?: {
    content: string
    timestamp: string
    senderId: string
    senderName: string
  }
  unreadCount: number
  isOnline: boolean
  lastSeen?: string
  messages?: any[]
}

export function ChatApp() {
  const { user, isLoaded } = useUserSync()
  const { socket, isConnected, connectionError } = useSocket()
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [activePanel, setActivePanel] = useState<'chat' | 'contacts' | 'profile'>('chat')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)

  const loadUserConversations = useCallback(async () => {
    if (isLoadingConversations) return
    
    setIsLoadingConversations(true)
    try {
      const response = await fetch('/api/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
        
        if (!selectedConversation && data.conversations?.length > 0) {
          setSelectedConversation(data.conversations[0])
        }
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setIsLoadingConversations(false)
    }
  }, [isLoadingConversations, selectedConversation])

  useEffect(() => {
    if (isLoaded && user && conversations.length === 0) {
      loadUserConversations()
    }
  }, [isLoaded, user, conversations.length, loadUserConversations])

  useEffect(() => {
    if (!socket) return

    const handleNewConversation = (newConversation: any) => {
      setConversations(prev => {
        const exists = prev.some(conv => conv.id === newConversation.id)
        if (exists) return prev
        return [newConversation, ...prev]
      })
    }

    const handleConversationUpdate = (updatedConversation: any) => {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === updatedConversation.id ? { ...conv, ...updatedConversation } : conv
        )
      )
    }

    socket.on('conversation:new', handleNewConversation)
    socket.on('conversation:updated', handleConversationUpdate)

    return () => {
      socket.off('conversation:new', handleNewConversation)
      socket.off('conversation:updated', handleConversationUpdate)
    }
  }, [socket])

  const handleConversationSelect = (id: string | null) => {
    const conversation = conversations.find(c => c.id === id) || null
    setSelectedConversation(conversation)
    setActivePanel('chat')
  }

  const handleContactSelect = async (contactId: string) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: contactId })
      })
      
      if (response.ok) {
        const data = await response.json()
        setSelectedConversation(data.conversation)
        setActivePanel('chat')
        
        loadUserConversations()
      }
    } catch (error) {
      console.error('Failed to create/find conversation:', error)
    }
  }

  if (!isLoaded || isLoadingConversations) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p>Loading your chats...</p>
          {connectionError && (
            <p className="text-red-500 mt-2">
              Connection Error: {connectionError}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        selectedConversation={selectedConversation?.id ?? null}
        onSelectConversation={handleConversationSelect}
        activePanel={activePanel}
        onPanelChange={setActivePanel}
      />
      <div className="flex-1">
        {activePanel === 'chat' && selectedConversation && (
          <ChatWindow
            conversation={selectedConversation as any}
            socket={socket}
            isConnected={isConnected}
          />
        )}
        {activePanel === 'chat' && !selectedConversation && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <h3 className="text-xl mb-2">Welcome to WhatsApp Clone</h3>
              <p>Select a conversation to start chatting</p>
              <p className="text-sm mt-2">
                Status: {isConnected ? 'Connected' : 'Disconnected'}
              </p>
            </div>
          </div>
        )}
        {activePanel === 'contacts' && (
          <ContactsPanel onSelectConversation={handleConversationSelect} />
        )}
        {activePanel === 'profile' && (
          <UserProfile />
        )}
      </div>
    </div>
  )
}
