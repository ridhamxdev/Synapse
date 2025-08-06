'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { MessageInputLocal } from './MessageInputLocal'
import MessageBubble from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { Spotlight } from '@/components/ui/spotlight'

interface Message {
  id: string
  content: string
  type: 'TEXT' | 'IMAGE' | 'FILE'
  senderId: string
  conversationId: string
  createdAt: string
  fileUrl?: string
  fileName?: string
  replyToId?: string
  sender: {
    id: string
    clerkId: string
    name: string
    imageUrl?: string
  }
}

interface ChatWindowProps {
  conversation: {
    id: string
    name?: string
    imageUrl?: string
    isOnline?: boolean
    lastSeen?: string
  }
  socket: any
  isConnected: boolean
  onMessageSent?: (message: Message) => void
}

export function ChatWindow({ conversation, socket, isConnected, onMessageSent }: ChatWindowProps) {
  const { user } = useUser()
  const [dbUserId, setDbUserId] = useState<string | null>(null)

  // Get the current user's database ID
  useEffect(() => {
    if (user?.id) {
      fetch('/api/users/sync', {
        method: 'POST'
      })
      .then(response => response.json())
      .then(data => {
        if (data.user) {
          setDbUserId(data.user.id)
        }
      })
      .catch(console.error)
    }
  }, [user?.id])
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUser, setTypingUser] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleNewMessage = useCallback((message: Message) => {
    if (message.conversationId !== conversation.id) return
    // Check if the message is from the current user using database ID
    if (message.sender.id === dbUserId) return
    setMessages(prev => {
      if (prev.some(m => m.id === message.id)) return prev
      return [...prev, message]
    })
    // Stop typing indicator when message is received
    setIsTyping(false)
    setTypingUser('')
  }, [conversation.id, dbUserId])

  const handleTypingStart = useCallback((data: { userId: string; userName: string }) => {
    // Check if the typing user is the current user using database ID
    if (data.userId === dbUserId) return
    setIsTyping(true)
    setTypingUser(data.userName)
  }, [dbUserId])

  const handleTypingStop = useCallback((data: { userId: string }) => {
    // Check if the typing user is the current user using database ID
    if (data.userId === dbUserId) return
    setIsTyping(false)
    setTypingUser('')
  }, [dbUserId])

  const addOptimisticMessage = useCallback((message: Message) => {
    setMessages(prev => {
      if (prev.some(m => m.id === message.id)) return prev
      return [...prev, message]
    })
    
    // Notify parent component about the new message
    if (onMessageSent) {
      onMessageSent(message)
    }
  }, [onMessageSent])

  const handleTyping = useCallback((isTyping: boolean) => {
    if (!socket || !conversation.id || !dbUserId) return
    
    if (isTyping) {
      socket.emit('typing:start', {
        conversationId: conversation.id,
        userId: dbUserId,
        userName: user?.username || user?.fullName || user?.firstName || 'User'
      })
    } else {
      socket.emit('typing:stop', {
        conversationId: conversation.id,
        userId: dbUserId
      })
    }
  }, [socket, conversation.id, dbUserId, user?.fullName, user?.firstName])

  useEffect(() => {
    if (!conversation.id) return
    setIsLoadingMessages(true)
    setMessages([])
    fetch(`/api/conversations/${conversation.id}/messages`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => setMessages(data.messages || []))
      .catch(console.error)
      .finally(() => setIsLoadingMessages(false))
  }, [conversation.id])

  useEffect(() => {
    if (!socket || !conversation.id) return
    socket.emit('join-conversation', conversation.id)
    socket.on('message:new', handleNewMessage)
    socket.on('typing:start', handleTypingStart)
    socket.on('typing:stop', handleTypingStop)
    return () => {
      socket.off('message:new', handleNewMessage)
      socket.off('typing:start', handleTypingStart)
      socket.off('typing:stop', handleTypingStop)
      socket.emit('leave-conversation', conversation.id)
    }
  }, [socket, conversation.id, handleNewMessage, handleTypingStart, handleTypingStop])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  if (!conversation.id) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Select a conversation to start chatting</p>
      </div>
    )
  }

  return (
    <Spotlight size={600} className="flex flex-col h-full bg-background">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center space-x-3 flex-shrink-0 glass-card">
        <img
          src={conversation.imageUrl || '/default-avatar.png'}
          alt={conversation.name}
          className="w-10 h-10 rounded-full object-cover avatar-hover"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{conversation.name}</h3>
          <p className="text-xs text-muted-foreground">
            {conversation.isOnline ? 'Online' : `Last seen ${conversation.lastSeen}`}
          </p>
        </div>
        <div
          className={`w-3 h-3 rounded-full flex-shrink-0 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
          title={isConnected ? 'Connected' : 'Disconnected'}
        />
      </div>

      <div className="flex-1 overflow-y-auto bg-muted/30">
        <div className="p-4">
          {isLoadingMessages ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map(msg => {
                // Compare using database user ID for accurate message ownership
                const isOwn = msg.sender.id === dbUserId;
                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={isOwn}
                  />
                )
              })}
              <TypingIndicator 
                isTyping={isTyping} 
                userName={typingUser}
              />
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      <div className="flex-shrink-0">
        <MessageInputLocal
          conversationId={conversation.id}
          socket={socket}
          onTyping={handleTyping}
          onOptimisticMessage={addOptimisticMessage}
          disabled={!isConnected}
          dbUserId={dbUserId}
        />
      </div>
    </Spotlight>
  )
}
