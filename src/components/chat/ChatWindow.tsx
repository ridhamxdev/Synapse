'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { MessageInput } from './MessageInput'
import { MessageBubble } from './MessageBubble'
import { Conversation, Message } from '@/types/chat'

export function ChatWindow({ conversation, socket, isConnected }: { conversation: Conversation, socket: any, isConnected: boolean }) {
  const { user } = useUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleNewMessage = useCallback((message: Message) => {
    console.log('🔔 Received new message:', message.id, 'from:', message.senderId)
    
    if (message.conversationId !== conversation?.id) {
      console.log('Message not for current conversation, ignoring')
      return
    }

    if (message.senderId === user?.id) {
      console.log('🚫 Ignoring own message from socket (handled optimistically)')
      return
    }
    
    setMessages(prev => {
      const exists = prev.some(m => m.id === message.id)
      if (exists) {
        console.log('Message already exists, skipping')
        return prev
      }
      console.log('✅ Adding new message from other user')
      return [...prev, message]
    })
  }, [conversation?.id, user?.id])

  const addOptimisticMessage = useCallback((message: Message) => {
    console.log('➕ Adding optimistic message:', message.id)
    setMessages(prev => {
      const exists = prev.some(m => m.id === message.id)
      if (exists) return prev
      return [...prev, message]
    })
  }, [])

  const handleTypingEvent = useCallback(({ userId, isTyping }: { userId: string, isTyping: boolean }) => {
    setTypingUsers(prev => {
      if (isTyping) {
        return prev.includes(userId) ? prev : [...prev, userId]
      } else {
        return prev.filter(id => id !== userId)
      }
    })
  }, [])

  useEffect(() => {
    if (!conversation?.id) return

    const loadMessages = async () => {
      setIsLoadingMessages(true)
      setMessages([])
      try {
        const response = await fetch(`/api/conversations/${conversation.id}/messages`)
        if (response.ok) {
          const data = await response.json()
          setMessages(data.messages || [])
        }
      } catch (error) {
        console.error('Failed to load messages:', error)
      } finally {
        setIsLoadingMessages(false)
      }
    }

    loadMessages()
  }, [conversation?.id])

  useEffect(() => {
    if (!socket || !conversation?.id) return

    console.log('Setting up socket listeners for conversation:', conversation.id)

    socket.emit('join-conversation', conversation.id)
    socket.on('message:new', handleNewMessage)
    socket.on('user:typing', handleTypingEvent)

    return () => {
      console.log('Cleaning up socket listeners for conversation:', conversation.id)
      socket.off('message:new', handleNewMessage)
      socket.off('user:typing', handleTypingEvent)
      socket.emit('leave-conversation', conversation.id)
    }
  }, [socket, conversation?.id, handleNewMessage, handleTypingEvent])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleTyping = (isTyping: boolean) => {
    if (!socket || !conversation) return
    
    socket.emit('typing', {
      conversationId: conversation.id,
      isTyping
    })
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Select a conversation to start chatting</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center space-x-3">
        <img
          src={conversation.imageUrl || '/default-avatar.png'}
          alt={conversation.name}
          className="w-10 h-10 rounded-full"
        />
        <div className="flex-1">
          <h3 className="font-semibold">{conversation.name}</h3>
          <p className="text-xs text-gray-500">
            {typingUsers.length > 0 
              ? `${typingUsers.length} user${typingUsers.length > 1 ? 's' : ''} typing...`
              : conversation?.isOnline 
                ? 'Online' 
                : `Last seen ${conversation?.lastSeen}`
            }
          </p>
        </div>
        <div 
          className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
          title={isConnected ? 'Connected' : 'Disconnected'} 
        />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingMessages ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message as any}
                isOwn={message.senderId === user?.id}
              />
            ))}
            {typingUsers.length > 0 && (
              <div className="flex items-center space-x-2 text-gray-500 text-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span>typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <MessageInput
        conversationId={conversation.id}
        socket={socket}
        onTyping={handleTyping}
        onOptimisticMessage={addOptimisticMessage}
        disabled={!isConnected}
      />
    </div>
  )
}
