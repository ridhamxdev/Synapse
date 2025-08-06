'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useUserSync } from '@/hooks/useUserSync'
import { useTheme } from '@/contexts/ThemeContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ConversationList } from '@/components/chat/ConversationList'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { DarkModeToggle } from '@/components/ui/DarkModeToggle'
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
  const { theme } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [searchResults, setSearchResults] = useState<Conversation[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Search through messages when query changes
  useEffect(() => {
    const searchMessages = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch(`/api/conversations/search?q=${encodeURIComponent(searchQuery)}`)
        if (response.ok) {
          const data = await response.json()
          setSearchResults(data.conversations || [])
        }
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    const timeoutId = setTimeout(searchMessages, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Add search modal
  const handleSearchClose = () => setShowSearch(false)
  const handleResultSelect = (messageId: string) => {
    // Handle message selection
    setShowSearch(false)
  }

  return (
    <div className={`w-80 flex flex-col flex-shrink-0 relative overflow-visible z-10 glass-card ${
      theme === 'dark' ? 'bg-slate-800/80 border-r border-slate-700/50' : 'bg-white/80 border-r border-slate-200/50'
    }`}>
      <div className={`p-4 border-b flex-shrink-0 transition-colors duration-300 ${
        theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
      }`}>
        <div className="flex items-center justify-between mb-4 relative">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 flex-shrink-0 avatar-hover">
              <AvatarImage src={dbUser?.imageUrl || user?.imageUrl} />
              <AvatarFallback className={`${
                theme === 'dark' ? 'bg-slate-600 text-slate-200' : 'bg-slate-200 text-slate-700'
              }`}>
                {dbUser?.name?.charAt(0) || user?.firstName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold truncate transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>{dbUser?.name || user?.fullName}</h3>
              <p className={`text-xs transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-slate-500'
              }`}>
                {isConnected ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>

          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={`h-8 w-8 transition-colors duration-200 ${
                  theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                }`}>
                  <svg className={`w-4 h-4 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                alignOffset={0}
                side="bottom"
                sideOffset={4}
                className={`w-56 z-[9999] shadow-2xl border dropdown-menu-content transition-colors duration-300 ${
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-700 text-white' 
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  marginTop: '4px',
                  zIndex: 9999
                }}
              >
                <DropdownMenuItem onClick={() => onPanelChange('profile')} className={`cursor-pointer transition-colors duration-200 ${
                  theme === 'dark' ? 'hover:bg-slate-700 focus:bg-slate-700' : 'hover:bg-slate-100 focus:bg-slate-100'
                }`}>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setShowSearch(true)} className={`cursor-pointer transition-colors duration-200 ${
                  theme === 'dark' ? 'hover:bg-slate-700 focus:bg-slate-700' : 'hover:bg-slate-100 focus:bg-slate-100'
                }`}>
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
                    className={`w-full justify-start p-0 font-normal transition-colors duration-200 ${
                      theme === 'dark'
                        ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20 focus:bg-red-900/20'
                        : 'text-red-600 hover:text-red-700 hover:bg-red-50 focus:bg-red-50'
                    }`}
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
            className={`flex-1 transition-all duration-200 ${
              activePanel === 'chat' 
                ? (theme === 'dark' ? 'bg-gray-300 hover:bg-gray-300 text-black' : 'bg-gray-300 hover:bg-gray-300')
                : (theme === 'dark' ? 'hover:bg-slate-700 text-white' : 'hover:bg-slate-100 text-black')
            }`}
          >
            Chats
          </Button>
          <Button
            variant={activePanel === 'contacts' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onPanelChange('contacts')}
            className={`flex-1 transition-all duration-200 ${
              activePanel === 'contacts' 
                ? (theme === 'dark' ? 'bg-gray-300 hover:bg-gray-300 text-black' : 'bg-gray-300 hover:bg-gray-300')
                : (theme === 'dark' ? 'hover:bg-slate-700 text-white' : 'hover:bg-slate-100 text-black')
            }`}
          >
            Contacts
          </Button>
          <Button
            variant={activePanel === 'profile' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onPanelChange('profile')}
            className={`flex-1 transition-all duration-200 ${
              activePanel === 'profile' 
                ? (theme === 'dark' ? 'bg-gray-300 hover:bg-gray-300 text-black' : 'bg-gray-300 hover:bg-gray-300')
                : (theme === 'dark' ? 'hover:bg-slate-700 text-white' : 'hover:bg-slate-100 text-black')
            }`}
          >
            Profile
          </Button>
        </div>
      </div>

      <div className={`p-4 border-b flex-shrink-0 transition-colors duration-300 ${
        theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
      }`}>
        <div className="relative">
          <Input
            placeholder={searchQuery ? "Searching messages..." : "Search conversations & messages"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-10 transition-colors duration-300 ${
              theme === 'dark' 
                ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
            }`}
          />
          <svg className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-slate-500'
          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {activePanel === 'chat' && (
          <ConversationList
            searchQuery={searchQuery}
            selectedConversation={selectedConversation}
            onSelectConversation={onSelectConversation}
            conversations={searchQuery.trim() ? searchResults : conversations}
            isLoading={isSearching || isLoadingConversations}
          />
        )}
      </ScrollArea>

      {/* Dark Mode Toggle at bottom */}
      <div className={`p-4 border-t flex-shrink-0 transition-colors duration-300 ${
        theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
      }`}>
        <div className="flex items-center justify-center">
          <DarkModeToggle />
        </div>
      </div>

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
