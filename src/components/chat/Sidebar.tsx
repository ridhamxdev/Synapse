'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useUserSync } from '@/hooks/useUserSync'
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
  const { dbUser } = useUserSync()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  // Add search modal
  const handleSearchClose = () => setShowSearch(false)
  const handleResultSelect = (messageId: string) => {
    // Handle message selection
    setShowSearch(false)
  }

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col flex-shrink-0 relative overflow-visible z-10">
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between mb-4 relative">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={dbUser?.imageUrl || user?.imageUrl} />
              <AvatarFallback>
                {dbUser?.name?.charAt(0) || user?.firstName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate text-foreground">{dbUser?.name || user?.fullName}</h3>
              <p className="text-xs text-muted-foreground">
                {isConnected ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>

          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent/50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                alignOffset={0}
                side="bottom"
                sideOffset={4}
                className="w-56 z-[9999] shadow-2xl border border-border dropdown-menu-content bg-popover text-popover-foreground" 
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  marginTop: '4px',
                  zIndex: 9999
                }}
              >
                <DropdownMenuItem onClick={() => onPanelChange('profile')} className="cursor-pointer hover:bg-accent focus:bg-accent">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer p-0">
                  <div className="w-full px-2 py-1.5">
                    <ThemeToggle showText={true} className="w-full justify-start hover:bg-accent focus:bg-accent" variant="ghost" />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowSearch(true)} className="cursor-pointer hover:bg-accent focus:bg-accent">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search Messages
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <SignOutButton 
                    variant="ghost" 
                    className="w-full justify-start p-0 font-normal text-destructive hover:text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
                  />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex space-x-1">
          <Button
            variant={activePanel === 'chat' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onPanelChange('chat')}
            className="flex-1 transition-all duration-200"
          >
            Chats
          </Button>
          <Button
            variant={activePanel === 'contacts' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onPanelChange('contacts')}
            className="flex-1 transition-all duration-200"
          >
            Contacts
          </Button>
          <Button
            variant={activePanel === 'profile' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onPanelChange('profile')}
            className="flex-1 transition-all duration-200"
          >
            Profile
          </Button>
        </div>
      </div>

      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="relative">
          <Input
            placeholder="Search conversations"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
