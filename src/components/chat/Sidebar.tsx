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

interface SidebarProps {
  selectedConversation: string | null
  onSelectConversation: (id: string | null) => void
  activePanel: 'chat' | 'contacts' | 'profile'
  onPanelChange: (panel: 'chat' | 'contacts' | 'profile') => void
  conversations?: any[]
  isConnected?: boolean
}

export function Sidebar({
  selectedConversation,
  onSelectConversation,
  activePanel,
  onPanelChange,
  conversations = [],
  isConnected = false
}: SidebarProps) {
  const { user } = useUser()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback>
                {user?.firstName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{user?.fullName}</h3>
              <p className="text-xs text-gray-500">
                {isConnected ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                Menu
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

      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Input
            placeholder="Search conversations"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {activePanel === 'chat' && (
          <ConversationList
            searchQuery={searchQuery}
            selectedConversation={selectedConversation}
            onSelectConversation={onSelectConversation}
          />
        )}
      </ScrollArea>
    </div>
  )
}
