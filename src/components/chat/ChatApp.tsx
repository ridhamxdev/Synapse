'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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
  participants: Array<{
    id: string
    name: string
    imageUrl?: string
  }>
  messages?: Array<{
    id: string
    content: string
    type: string
    senderId: string
    conversationId: string
    createdAt: string
    updatedAt: string
    isDelivered: boolean
    isRead: boolean
    readAt?: string
    deliveredAt?: string
  }>
}

export function ChatApp() {
  const { user, isLoaded, dbUser } = useUserSync()
  const { socket, isConnected, connectionError } = useSocket()
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [activePanel, setActivePanel] = useState<'chat' | 'contacts' | 'profile'>('chat')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false)
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const loadUserConversations = useCallback(async () => {
    if (isLoadingConversations) return
    
    setIsLoadingConversations(true)
    try {
      const response = await fetch('/api/conversations')
      if (response.ok) {
        const data = await response.json()
        const newConversations = data.conversations || []
        setConversations(newConversations)
        
        if (!selectedConversation && newConversations.length > 0) {
          setSelectedConversation(newConversations[0])
        }
        
        setHasLoadedInitial(true)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setIsLoadingConversations(false)
    }
  }, [isLoadingConversations])

  const handleMessageSent = useCallback((message: any) => {
  }, [])

  useEffect(() => {
    if (isLoaded && user && !hasLoadedInitial) {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
      }
      
      loadTimeoutRef.current = setTimeout(() => {
        loadUserConversations()
      }, 100)
    }
    
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
      }
    }
  }, [isLoaded, user, hasLoadedInitial, loadUserConversations])

  useEffect(() => {
    if (isLoaded && user) {
      loadUserConversations()
    }
  }, [user?.id, isLoaded])

  useEffect(() => {
    if (!socket) return

    const handleNewConversation = (newConversation: Conversation) => {
      setConversations(prev => {
        const exists = prev.some(conv => conv.id === newConversation.id)
        if (exists) return prev
        return [newConversation, ...prev]
      })
    }

    const handleConversationUpdate = (updatedConversation: Conversation) => {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === updatedConversation.id ? { ...conv, ...updatedConversation } : conv
        )
      )
      
      if (selectedConversation?.id === updatedConversation.id) {
        setSelectedConversation(updatedConversation)
      }
    }

    const handleNewMessage = (message: any) => {
      if (message.senderId !== dbUser?.id) {
        setConversations(prev => 
          prev.map(conv => {
            if (conv.id === message.conversationId) {
              return {
                ...conv,
                lastMessage: {
                  content: message.content,
                  timestamp: message.createdAt,
                  senderId: message.senderId,
                  senderName: message.sender?.name || 'Unknown'
                },
                unreadCount: conv.unreadCount + 1
              }
            }
            return conv
          })
        )
      }
    }

    socket.on('conversation:new', handleNewConversation)
    socket.on('conversation:updated', handleConversationUpdate)
    socket.on('message:new', handleNewMessage)

    return () => {
      socket.off('conversation:new', handleNewConversation)
      socket.off('conversation:updated', handleConversationUpdate)
      socket.off('message:new', handleNewMessage)
    }
  }, [socket, selectedConversation?.id, dbUser?.id])

  const handleConversationSelect = (id: string | null) => {
    if (!id) {
      setSelectedConversation(null)
      setActivePanel('chat')
      return
    }
    
    let conversation = conversations.find(c => c.id === id) || null
    
    if (!conversation) {
      fetch(`/api/conversations/${id}`)
        .then(response => response.json())
        .then(data => {
          if (data.conversation) {
            setSelectedConversation(data.conversation)
            setActivePanel('chat')
            
            setConversations(prev => {
              const exists = prev.some(conv => conv.id === id)
              if (exists) return prev
              return [data.conversation, ...prev]
            })
          }
        })
        .catch(error => {
          console.error('❌ Failed to fetch conversation:', error)
        })
    } else {
      setSelectedConversation(conversation)
      setActivePanel('chat')
      
      if (conversation.unreadCount > 0) {
        setConversations(prev => 
          prev.map(conv => 
            conv.id === id ? { ...conv, unreadCount: 0 } : conv
          )
        )
      }
    }
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
        
        if (data.conversation && data.conversation.id) {
          if (data.isNew) {
            setConversations(prev => {
              const exists = prev.some(conv => conv.id === data.conversation.id)
              if (exists) return prev
              return [data.conversation, ...prev]
            })
          }
          
          setSelectedConversation(data.conversation)
          setActivePanel('chat')
          
        } else {
          console.error('❌ Invalid conversation data:', data)
        }
      } else {
        const errorText = await response.text()
        console.error('❌ API Error:', response.status, errorText)
      }
    } catch (error) {
      console.error('Failed to create/find conversation:', error)
    }
  }

  if (!isLoaded || (isLoadingConversations && !hasLoadedInitial)) {
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
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar 
        selectedConversation={selectedConversation?.id ?? null}
        onSelectConversation={handleConversationSelect}
        activePanel={activePanel}
        onPanelChange={setActivePanel}
        conversations={conversations}
        isLoadingConversations={isLoadingConversations}
        isConnected={isConnected}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {activePanel === 'chat' && selectedConversation && (
          <ChatWindow
            conversation={selectedConversation as any}
            socket={socket}
            isConnected={isConnected}
            onMessageSent={handleMessageSent}
          />
        )}
        {activePanel === 'chat' && !selectedConversation && (
          <div className="flex items-center justify-center h-full bg-white">
            <div className="text-center text-gray-500 max-w-md mx-auto px-4">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Welcome to WhatsApp Clone</h3>
              <p className="text-gray-600 mb-4">Select a conversation to start chatting</p>
              <div className="flex items-center justify-center space-x-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
          </div>
        )}
        {activePanel === 'contacts' && (
          <ContactsPanel onSelectConversation={(conversation) => {
            if (conversation && conversation.id) {
              setConversations(prev => {
                const exists = prev.some(conv => conv.id === conversation.id)
                if (exists) return prev
                return [conversation, ...prev]
              })
              
              setSelectedConversation(conversation)
              setActivePanel('chat')
              
              setTimeout(() => {
                loadUserConversations()
              }, 500)
            }
          }} />
        )}
        {activePanel === 'profile' && (
          <UserProfile />
        )}
      </div>
    </div>
  )
}
