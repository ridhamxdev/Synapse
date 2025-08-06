'use client'

import { useUser } from '@clerk/nextjs'
import { useTheme } from '@/contexts/ThemeContext'
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
    senderImageUrl?: string
    messageId?: string
  }
  unreadCount: number
  isOnline: boolean
  lastSeen?: string
  participants: Array<{
    id: string
    name: string
    imageUrl?: string
  }>
  matchCount?: number
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
  const { theme } = useTheme()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // If there's a search query, use the conversations as-is (they're already filtered from the API)
  // If no search query, filter by conversation name locally
  const filteredConversations = searchQuery.trim() 
    ? conversations 
    : conversations.filter((conv) =>
        conv.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )

  if (filteredConversations.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 transition-colors duration-300 ${
        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
      }`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors duration-300 ${
          theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'
        }`}>
          <svg className={`w-8 h-8 transition-colors duration-300 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-sm">
          {searchQuery.trim() ? 'No messages found' : 'No conversations found'}
        </p>
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

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-700 px-1 rounded">
          {part}
        </mark>
      ) : part
    )
  }

  return (
    <div className={`divide-y transition-colors duration-300 ${
      theme === 'dark' ? 'divide-slate-700' : 'divide-slate-200'
    }`}>
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
                ? (theme === 'dark' ? 'bg-blue-500/20 border-r-2 border-blue-500' : 'bg-blue-500/10 border-r-2 border-blue-500')
                : (theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100')
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
                    isSelected ? 'text-primary' : 'text-foreground'
                  }`}>
                    {searchQuery.trim() ? highlightText(displayName, searchQuery) : displayName}
                  </h4>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {searchQuery.trim() && conv.matchCount && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        theme === 'dark' 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-blue-500/10 text-blue-600'
                      }`}>
                        {conv.matchCount} match{conv.matchCount !== 1 ? 'es' : ''}
                      </span>
                    )}
                    {conv.lastMessage && !searchQuery.trim() && (
                      <span className="text-xs text-muted-foreground">
                        {formatLastMessageTime(conv.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                </div>
                
                {conv.lastMessage ? (
                  <div className="mt-1">
                    {searchQuery.trim() && (
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <img
                            src={conv.lastMessage.senderImageUrl || '/default-avatar.png'}
                            alt={conv.lastMessage.senderId === user?.id ? 'You' : conv.lastMessage.senderName}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span className={`text-xs font-medium ${
                            conv.lastMessage.senderId === user?.id 
                              ? 'text-blue-600 dark:text-blue-400' 
                              : 'text-green-600 dark:text-green-400'
                          }`}>
                            {conv.lastMessage.senderId === user?.id ? 'You' : conv.lastMessage.senderName}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatLastMessageTime(conv.lastMessage.timestamp)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <p className={`text-sm text-muted-foreground ${searchQuery.trim() ? 'leading-relaxed' : 'truncate'}`}>
                        <span className="text-muted-foreground">
                          {!searchQuery.trim() && (conv.lastMessage.senderId === user?.id ? 'You: ' : '')}
                        </span>
                        {searchQuery.trim() 
                          ? highlightText(truncateMessage(conv.lastMessage.content, 100), searchQuery)
                          : truncateMessage(conv.lastMessage.content)
                        }
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                          {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">No messages yet</p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
