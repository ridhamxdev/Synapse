'use client'

import { useUser } from '@clerk/nextjs'
import { format } from 'date-fns'

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
}

interface ConversationListProps {
  searchQuery: string
  selectedConversation: string | null
  onSelectConversation: (conversationId: string) => void
  conversations: Conversation[]
  isLoading?: boolean
}

export function ConversationList({
  searchQuery,
  selectedConversation,
  onSelectConversation,
  conversations,
  isLoading = false
}: ConversationListProps) {
  const { user } = useUser()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
      </div>
    )
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (filteredConversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-500">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-sm">No conversations found</p>
        {searchQuery && <p className="text-xs mt-1">Try adjusting your search</p>}
      </div>
    )
  }

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return format(date, 'HH:mm')
    } else if (diffInHours < 168) {
      return format(date, 'EEE')
    } else {
      return format(date, 'MMM d')
    }
  }

  const truncateMessage = (message: string, maxLength: number = 30) => {
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message
  }

  return (
    <div className="divide-y divide-gray-200">
      {filteredConversations.map((conv) => {
        const isSelected = selectedConversation === conv.id
        const otherParticipant = conv.participants?.find(p => p.id !== user?.id)
        const displayName = conv.name || otherParticipant?.name || 'Untitled Conversation'
        const displayImage = conv.imageUrl || otherParticipant?.imageUrl

        return (
          <div
            key={conv.id}
            className={`p-4 cursor-pointer transition-colors duration-150 ${
              isSelected 
                ? 'bg-green-50 border-r-2 border-green-500' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onSelectConversation(conv.id)}
          >
            <div className="flex items-center space-x-3">
              <div className="relative flex-shrink-0">
                <img
                  src={displayImage || '/default-avatar.png'}
                  alt={displayName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                {conv.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-medium truncate ${
                    isSelected ? 'text-green-700' : 'text-gray-900'
                  }`}>
                    {displayName}
                  </h4>
                  {conv.lastMessage && (
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatLastMessageTime(conv.lastMessage.timestamp)}
                    </span>
                  )}
                </div>
                
                {conv.lastMessage ? (
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-600 truncate">
                      <span className="text-gray-500">
                        {conv.lastMessage.senderId === user?.id ? 'You: ' : ''}
                      </span>
                      {truncateMessage(conv.lastMessage.content)}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">No messages yet</p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
