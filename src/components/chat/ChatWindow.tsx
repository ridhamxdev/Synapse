'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { MessageInput } from './MessageInput'
import MessageBubble from './MessageBubble'

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
}

export function ChatWindow({ conversation, socket, isConnected }: ChatWindowProps) {
  const { user } = useUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleNewMessage = useCallback((message: Message) => {
    if (message.conversationId !== conversation.id) return
    if (message.senderId === user?.id) return
    setMessages(prev => {
      if (prev.some(m => m.id === message.id)) return prev
      return [...prev, message]
    })
  }, [conversation.id, user?.id])

  const addOptimisticMessage = useCallback((message: Message) => {
    setMessages(prev => {
      if (prev.some(m => m.id === message.id)) return prev
      return [...prev, message]
    })
  }, [])

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
    return () => {
      socket.off('message:new', handleNewMessage)
      socket.emit('leave-conversation', conversation.id)
    }
  }, [socket, conversation.id, handleNewMessage])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!conversation.id) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Select a conversation to start chatting</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b px-4 py-3 flex items-center space-x-3">
        <img
          src={conversation.imageUrl || '/default-avatar.png'}
          alt={conversation.name}
          className="w-10 h-10 rounded-full"
        />
        <div className="flex-1">
          <h3 className="font-semibold">{conversation.name}</h3>
          <p className="text-xs text-gray-500">
            {conversation.isOnline ? 'Online' : `Last seen ${conversation.lastSeen}`}
          </p>
        </div>
        <div
          className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
          title={isConnected ? 'Connected' : 'Disconnected'}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {isLoadingMessages ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map(msg => {
              const isOwn = msg.sender.id === user?.id;
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={isOwn}
                />
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <MessageInput
        conversationId={conversation.id}
        socket={socket}
        onTyping={() => {}}
        onOptimisticMessage={addOptimisticMessage}
        disabled={!isConnected}
      />
    </div>
  )
}
