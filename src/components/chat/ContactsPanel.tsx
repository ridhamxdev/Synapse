'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useTheme } from '@/contexts/ThemeContext'
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
import { CreateGroupModal } from './CreateGroupModal'

interface ContactsPanelProps {
  onSelectConversation: (conversation: any) => void
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
  const { theme } = useTheme()
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const searchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        const errorData = await response.json()
        console.error('❌ Search error:', errorData)
        toast.error('Failed to search users')
        setUsers([])
      }
    } catch (error) {
      console.error('🔴 Search request failed:', error)
      toast.error('Network error while searching')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleStartConversation = async (userId: string) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          participantId: userId 
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error:', response.status, errorText)
        
        if (response.status === 404) {
          toast.error('Conversation API not found. Please check server setup.')
        } else if (response.status === 500) {
          toast.error('Server error. Please try again.')
        } else {
          toast.error('Failed to start conversation')
        }
        return
      }

      const data = await response.json()
      
      if (data.conversation && data.conversation.id) {
        onSelectConversation(data.conversation)
        toast.success(data.isNew ? 'New conversation started!' : 'Opened existing conversation!')
      } else {
        console.error('❌ Invalid conversation data:', data)
        toast.error('Invalid response from server')
      }
    } catch (error) {
      console.error('🔴 Conversation creation failed:', error)
      toast.error('Network error. Please check your connection.')
    }
  }

  const formatLastSeen = (lastSeen: string) => {
    try {
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
    } catch (error) {
      return 'Last seen unknown'
    }
  }

  const handleGroupCreated = (group: any) => {
    // Navigate to the newly created group
    onSelectConversation(group)
  }

  return (
    <div className={`flex flex-col h-full transition-colors duration-300 ${
      theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'
    }`}>
      <div className={`border-b p-6 transition-colors duration-300 ${
        theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-semibold transition-colors duration-300 ${
            theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
          }`}>Contacts</h2>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setShowCreateGroup(true)}
            className={`transition-colors duration-200 ${
              theme === 'dark' ? 'border-slate-600 hover:bg-slate-700' : 'border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Users className="h-4 w-4 mr-2" />
            New Group
          </Button>
        </div>

        <div className="relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors duration-300 ${
            theme === 'dark' ? 'text-slate-400' : 'text-gray-400'
          }`} />
          <Input
            placeholder="Search contacts by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-10 transition-colors duration-300 ${
              theme === 'dark' 
                ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400' 
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
            }`}
          />
        </div>
      </div>



      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 animate-pulse">
                  <div className={`w-12 h-12 rounded-full transition-colors duration-300 ${
                    theme === 'dark' ? 'bg-slate-600' : 'bg-gray-300'
                  }`}></div>
                  <div className="flex-1 space-y-2">
                    <div className={`h-4 rounded w-3/4 transition-colors duration-300 ${
                      theme === 'dark' ? 'bg-slate-600' : 'bg-gray-300'
                    }`}></div>
                    <div className={`h-3 rounded w-1/2 transition-colors duration-300 ${
                      theme === 'dark' ? 'bg-slate-600' : 'bg-gray-300'
                    }`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-64 transition-colors duration-300 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <Users className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-center">
              {searchQuery ? 'No contacts found' : 'No contacts available'}
            </p>
            <p className="text-sm text-center mt-2">
              {searchQuery ? 'Try a different search term' : 'No users have joined yet'}
            </p>
          </div>
        ) : (
          <div className={`divide-y transition-colors duration-300 ${
            theme === 'dark' ? 'divide-slate-700' : 'divide-slate-200'
          }`}>
            {users.map((foundUser) => (
                             <div
                 key={foundUser.id}
                 className={`p-4 transition-all duration-200 hover-lift ${
                   theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                 }`}
               >
                <div className="flex items-center space-x-4">
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={foundUser.imageUrl} />
                      <AvatarFallback className="bg-purple-500 text-white">
                        {foundUser.name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    {foundUser.isOnline && (
                      <div className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 rounded-full transition-colors duration-300 ${
                        theme === 'dark' ? 'border-slate-800' : 'border-white'
                      }`}></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-medium truncate transition-colors duration-300 ${
                        theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                      }`}>{foundUser.name}</h3>
                      <div className="flex items-center space-x-1">
                        {foundUser.isOnline && (
                          <Badge variant="outline" className="text-xs text-green-600">
                            Online
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className={`text-sm truncate transition-colors duration-300 ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {foundUser.bio || foundUser.email}
                    </p>
                    
                    {!foundUser.isOnline && foundUser.lastSeen && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatLastSeen(foundUser.lastSeen)}
                      </p>
                    )}
                  </div>

                                     <div className="flex items-center space-x-2">
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => handleStartConversation(foundUser.id)}
                       title="Start Chat"
                       className="hover:bg-primary/10 hover:text-primary transition-all duration-200"
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

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onGroupCreated={handleGroupCreated}
      />
    </div>
  )
}
