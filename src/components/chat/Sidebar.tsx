'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { ConversationList } from '@/components/chat/ConversationList'
import { 
  MessageCircle, 
  Users, 
  User, 
  Search,
  MoreVertical
} from 'lucide-react'
import { Conversation } from '@prisma/client'

interface SidebarProps {
  selectedConversation: string | null
  onSelectConversation: (id: string | null) => void
  activePanel: 'chat' | 'contacts' | 'profile'
  onPanelChange: (panel: 'chat' | 'contacts' | 'profile') => void
}

export function Sidebar({
  selectedConversation,
  onSelectConversation,
  activePanel,
  onPanelChange,
}: SidebarProps) {
  const { user } = useUser()
  const [searchQuery, setSearchQuery] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback>{user?.firstName?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{user?.fullName}</h3>
              <Badge variant="outline" className="text-xs">
                Online
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex space-x-1">
          <Button
            variant={activePanel === 'chat' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onPanelChange('chat')}
            className="flex-1"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Chats
          </Button>
          <Button
            variant={activePanel === 'contacts' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onPanelChange('contacts')}
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-2" />
            Contacts
          </Button>
          <Button
            variant={activePanel === 'profile' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onPanelChange('profile')}
            className="flex-1"
          >
            <User className="h-4 w-4 mr-2" />
            Profile
          </Button>
        </div>
      </div>

      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search conversations..."
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
