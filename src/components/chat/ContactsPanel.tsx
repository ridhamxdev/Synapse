'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  UserPlus, 
  Users, 
  Search,
  Phone,
  MessageCircle,
  MoreVertical
} from 'lucide-react'

interface ContactsPanelProps {
  onSelectConversation: (id: string) => void
}

interface User {
  id: string
  name: string
  phone?: string
  email?: string
  imageUrl?: string
  isOnline: boolean
  bio?: string
  lastSeen?: string
}

export function ContactsPanel({ onSelectConversation }: ContactsPanelProps) {
  const { user } = useUser()
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  // Search users
  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers()
    } else {
      setUsers([])
    }
  }, [searchQuery])

  const searchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to search users:', error)
      toast.error('Failed to search users')
    } finally {
      setLoading(false)
    }
  }

  const handleStartConversation = async (userId: string) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: userId })
      })

      if (response.ok) {
        const data = await response.json()
        onSelectConversation(data.conversation.id)
        toast.success('Conversation started!')
      } else {
        toast.error('Failed to start conversation')
      }
    } catch (error) {
      console.error('Failed to start conversation:', error)
      toast.error('Failed to start conversation')
    }
  }

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Last seen recently'
    } else if (diffInHours < 24) {
      return `Last seen ${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `Last seen ${diffInDays}d ago`
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Find Users</h2>
          <Button size="sm" variant="outline">
            <Users className="h-4 w-4 mr-2" />
            New Group
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search users by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
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
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Users className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-center">
              {searchQuery ? 'No users found' : 'Search for users to start chatting'}
            </p>
            <p className="text-sm text-center mt-2">
              {searchQuery ? 'Try a different search term' : 'Enter a name, email, or phone number'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {users.map((foundUser) => (
              <div
                key={foundUser.id}
                className="p-4 hover:bg-white dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={foundUser.imageUrl} />
                      <AvatarFallback className="bg-purple-500 text-white">
                        {foundUser.name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Online indicator */}
                    {foundUser.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium truncate">{foundUser.name}</h3>
                      <div className="flex items-center space-x-1">
                        {foundUser.isOnline && (
                          <Badge variant="outline" className="text-xs text-green-600">
                            Online
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {foundUser.bio || foundUser.email}
                    </p>
                    
                    {!foundUser.isOnline && foundUser.lastSeen && (
                      <p className="text-xs text-gray-400 mt-1">
                        {formatLastSeen(foundUser.lastSeen)}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartConversation(foundUser.id)}
                      title="Start Chat"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
