'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ConversationList } from '@/components/chat/ConversationList'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { MessageSearch } from '@/components/chat/MessageSearch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

interface SidebarProps {
  selectedConversation: string | null
  onSelectConversation: (id: string | null) => void
  activePanel: 'chat' | 'contacts' | 'profile'
  onPanelChange: (panel: 'chat' | 'contacts' | 'profile') => void
  conversations: Conversation[]
  isLoadingConversations?: boolean
  isConnected?: boolean
}

export function Sidebar({
  selectedConversation,
  onSelectConversation,
  activePanel,
  onPanelChange,
  conversations = [],
  isLoadingConversations = false,
  isConnected = false
}: SidebarProps) {
  const { user } = useUser()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  // Add search modal
  const handleSearchClose = () => setShowSearch(false)
  const handleResultSelect = (messageId: string) => {
    // Handle message selection
    setShowSearch(false)
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback>
                {user?.firstName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate text-gray-900">{user?.fullName}</h3>
              <p className="text-xs text-gray-500">
                {isConnected ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => onPanelChange('profile')}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ThemeToggle showText={true} />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowSearch(true)}>
                Search Messages
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <SignOutButton 
                  variant="ghost" 
                  className="w-full justify-start p-0 font-normal text-red-600 hover:text-red-600 hover:bg-red-50"
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex space-x-1">
          <Button
            variant={activePanel === 'chat' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onPanelChange('chat')}
            className="flex-1"
          >
            Chats
          </Button>
          <Button
            variant={activePanel === 'contacts' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onPanelChange('contacts')}
            className="flex-1"
          >
            Contacts
          </Button>
          <Button
            variant={activePanel === 'profile' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onPanelChange('profile')}
            className="flex-1"
          >
            Profile
          </Button>
        </div>
      </div>

      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="relative">
          <Input
            placeholder="Search conversations"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {activePanel === 'chat' && (
          <ConversationList
            searchQuery={searchQuery}
            selectedConversation={selectedConversation}
            onSelectConversation={onSelectConversation}
            conversations={conversations}
            isLoading={isLoadingConversations}
          />
        )}
      </ScrollArea>

      {/* Search modal */}
      {showSearch && (
        <MessageSearch
          conversationId={selectedConversation || ''}
          onResultSelect={handleResultSelect}
          onClose={handleSearchClose}
        />
      )}
    </div>
  )
}
