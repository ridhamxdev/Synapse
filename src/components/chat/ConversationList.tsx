'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns'
import { 
  Pin,
  Volume2,
  VolumeX,
  MoreVertical,
  MessageSquare,
  Users
} from 'lucide-react'

interface ConversationListProps {
  searchQuery: string
  selectedConversation: string | null
  onSelectConversation: (id: string | null) => void
}

interface Conversation {
  id: string
  type: 'DIRECT' | 'GROUP'
  name: string
  imageUrl?: string
  lastMessage?: {
    content: string
    timestamp: string
    senderId: string
    senderName: string
  }
  unreadCount: number
  isOnline?: boolean
  lastSeen?: string
  updatedAt: string
}

export function ConversationList({
  searchQuery,
  selectedConversation,
  onSelectConversation,
}: ConversationListProps) {
  const { user } = useUser()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch conversations from API
  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversation')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    
    if (isToday(date)) {
      return format(date, 'HH:mm')
    } else if (isYesterday(date)) {
      return 'Yesterday'
    } else {
      return format(date, 'dd/MM/yyyy')
    }
  }

  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.lastMessage) return 'No messages yet'
    
    const { content, senderName } = conversation.lastMessage
    const isOwn = conversation.lastMessage.senderId === user?.id
    
    if (conversation.type === 'GROUP' && !isOwn) {
      return `${senderName}: ${content}`
    }
    
    return isOwn ? `You: ${content}` : content
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (filteredConversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-center">
          {searchQuery ? 'No conversations found' : 'No conversations yet'}
        </p>
        <p className="text-sm text-center mt-2">
          {searchQuery ? 'Try a different search term' : 'Start a new conversation'}
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-700">
      {filteredConversations.map((conversation) => (
        <div
          key={conversation.id}
          className={cn(
            "p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors relative",
            selectedConversation === conversation.id && "bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500"
          )}
          onClick={() => onSelectConversation(conversation.id)}
        >
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <Avatar className="h-12 w-12">
                <AvatarImage src={conversation.imageUrl} />
                <AvatarFallback className="bg-blue-500 text-white">
                  {conversation.type === 'GROUP' ? (
                    <Users className="h-6 w-6" />
                  ) : (
                    conversation.name[0]?.toUpperCase()
                  )}
                </AvatarFallback>
              </Avatar>
              
              {/* Online indicator for direct chats */}
              {conversation.type === 'DIRECT' && conversation.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className={cn(
                  "font-medium truncate",
                  conversation.unreadCount > 0 ? "font-semibold" : "font-normal"
                )}>
                  {conversation.name}
                </h4>

                {/* Timestamp */}
                {conversation.lastMessage && (
                  <span className="text-xs text-gray-500">
                    {formatMessageTime(conversation.lastMessage.timestamp)}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                {/* Last message */}
                <p className={cn(
                  "text-sm truncate flex-1",
                  conversation.unreadCount > 0 
                    ? "text-gray-900 dark:text-white font-medium" 
                    : "text-gray-500 dark:text-gray-400"
                )}>
                  {getLastMessagePreview(conversation)}
                </p>

                {/* Unread count */}
                {conversation.unreadCount > 0 && (
                  <Badge 
                    variant="default" 
                    className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 text-xs rounded-full min-w-[1.25rem] h-5 flex items-center justify-center"
                  >
                    {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
