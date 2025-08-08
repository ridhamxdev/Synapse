'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { useTheme } from '@/contexts/ThemeContext'
import { MessageInputLocal } from './MessageInputLocal'
import { Button } from '@/components/ui/button'
import { Video, Phone, Monitor } from 'lucide-react'
import { format } from 'date-fns'
import MessageBubble from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { Spotlight } from '@/components/ui/spotlight'
import { UserProfileDrawer } from './UserProfileDrawer'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface Message {
  id: string
  content: string
  type: 'TEXT' | 'IMAGE' | 'FILE'
  senderId: string
  conversationId: string
  createdAt: string
  fileUrl?: string
  fileName?: string
  replyToId?: string
  replyTo?: {
    id: string
    content: string
    sender?: { name?: string }
  }
  sender: {
    id: string
    clerkId: string
    name: string
    imageUrl?: string
  }
}

interface ChatWindowProps {
  conversation: {
    id: string
    name?: string
    imageUrl?: string
    isOnline?: boolean
    lastSeen?: string
    otherUserId?: string
  }
  socket: any
  isConnected: boolean
  onMessageSent?: (message: Message) => void
}

export function ChatWindow({ conversation, socket, isConnected, onMessageSent }: ChatWindowProps) {
  const { user } = useUser()
  const { theme } = useTheme()
  const [dbUserId, setDbUserId] = useState<string | null>(null)
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false)
  const [replyContext, setReplyContext] = useState<Message | null>(null)
  const [isForwardOpen, setIsForwardOpen] = useState(false)
  const [forwardSource, setForwardSource] = useState<Message | null>(null)
  const [allConversations, setAllConversations] = useState<any[]>([])
  const [conversationSearch, setConversationSearch] = useState('')

  useEffect(() => {
    if (user?.id) {
      fetch('/api/users/sync', {
        method: 'POST'
      })
      .then(response => response.json())
      .then(data => {
        if (data.user) {
          setDbUserId(data.user.id)
        }
      })
      .catch(console.error)
    }
  }, [user?.id])
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUser, setTypingUser] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleNewMessage = useCallback((message: Message) => {
    if (message.conversationId !== conversation.id) return
    if (message.sender.id === dbUserId) return
    setMessages(prev => {
      if (prev.some(m => m.id === message.id)) return prev
      return [...prev, message]
    })
    setIsTyping(false)
    setTypingUser('')
  }, [conversation.id, dbUserId])

  const handleTypingStart = useCallback((data: { userId: string; userName: string }) => {
    if (data.userId === dbUserId) return
    setIsTyping(true)
    setTypingUser(data.userName)
  }, [dbUserId])

  const handleTypingStop = useCallback((data: { userId: string }) => {
    if (data.userId === dbUserId) return
    setIsTyping(false)
    setTypingUser('')
  }, [dbUserId])

  const addOptimisticMessage = useCallback((message: Message) => {
    setMessages(prev => {
      if (prev.some(m => m.id === message.id)) return prev
      return [...prev, message]
    })
    
    if (onMessageSent) {
      onMessageSent(message)
    }
  }, [onMessageSent])

  const handleTyping = useCallback((isTyping: boolean) => {
    if (!socket || !conversation.id || !dbUserId) return
    
    if (isTyping) {
      socket.emit('typing:start', {
        conversationId: conversation.id,
        userId: dbUserId,
        userName: user?.username || user?.fullName || user?.firstName || 'User'
      })
    } else {
      socket.emit('typing:stop', {
        conversationId: conversation.id,
        userId: dbUserId
      })
    }
  }, [socket, conversation.id, dbUserId, user?.fullName, user?.firstName])

  useEffect(() => {
    if (!conversation.id) return
    setIsLoadingMessages(true)
    setMessages([])
    fetch(`/api/conversations/${conversation.id}/messages`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => setMessages(data.messages || []))
      .catch(console.error)
      .finally(() => setIsLoadingMessages(false))
  }, [conversation.id])

  useEffect(() => {
    if (!socket || !conversation.id) return
    socket.emit('join-conversation', conversation.id)
    socket.on('message:new', handleNewMessage)
    socket.on('typing:start', handleTypingStart)
    socket.on('typing:stop', handleTypingStop)
    return () => {
      socket.off('message:new', handleNewMessage)
      socket.off('typing:start', handleTypingStart)
      socket.off('typing:stop', handleTypingStop)
      socket.emit('leave-conversation', conversation.id)
    }
  }, [socket, conversation.id, handleNewMessage, handleTypingStart, handleTypingStop])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    fetch('/api/conversations')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => setAllConversations(data.conversations || []))
      .catch(() => setAllConversations([]))
  }, [])

  const handleProfileClick = () => {
    if (conversation.otherUserId) {
      setIsProfileDrawerOpen(true)
    }
  }

  const handleStartChat = () => {
    setIsProfileDrawerOpen(false)
  }

  const handleStartCall = () => {
    console.log('Starting call with:', conversation.otherUserId)
    setIsProfileDrawerOpen(false)
  }

  const handleStartVideoCall = () => {
    console.log('Starting video call with:', conversation.otherUserId)
    setIsProfileDrawerOpen(false)
  }

  const formatLastSeen = (lastSeen: string) => {
    try {
      const date = new Date(lastSeen)
      const now = new Date()
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      
      if (diffInMinutes < 1) {
        return { text: 'just now', type: 'recent' }
      } else if (diffInMinutes < 60) {
        return { text: `${diffInMinutes}m ago`, type: 'recent' }
      } else if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60)
        return { text: `${hours}h ago`, type: 'hours' }
      } else {
        return { text: format(date, 'MMM d, yyyy at HH:mm'), type: 'date' }
      }
    } catch (error) {
      return { text: 'unknown', type: 'unknown' }
    }
  }

  if (!conversation.id) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className={`${theme === 'dark' ? 'text-white' : 'text-muted-foreground'}`}>Select a conversation to start chatting</p>
      </div>
    )
  }

  return (
    <Spotlight size={600} className="flex flex-col h-full bg-background">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center space-x-3 flex-shrink-0 glass-card">
        <div 
          className="flex items-center space-x-3 flex-1 cursor-pointer rounded-lg p-2 transition-colors duration-200 clickable"
          onClick={handleProfileClick}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <img
            src={conversation.imageUrl || '/default-avatar.png'}
            alt={conversation.name}
            className="w-10 h-10 rounded-full object-cover avatar-hover"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className={`font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-foreground'}`}>{conversation.name}</h3>
              <div
                className={`w-3 h-3 rounded-full flex-shrink-0 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                title={isConnected ? 'Connected' : 'Disconnected'}
              />
            </div>
            <div className="flex items-center space-x-1">
              {conversation.isOnline ? (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                    Online
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                    Last seen
                  </span>
                  {conversation.lastSeen ? (
                    (() => {
                      const lastSeenInfo = formatLastSeen(conversation.lastSeen)
                      return (
                        <span className={`text-xs font-medium ${
                          lastSeenInfo.type === 'recent' 
                            ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                            : lastSeenInfo.type === 'hours'
                            ? theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                            : theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                        }`}>
                          {lastSeenInfo.text}
                        </span>
                      )
                    })()
                  ) : (
                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      unknown
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => console.log('Video call clicked')}
            title="Video Call"
          >
            <Video className={`h-4 w-4 ${theme === 'dark' ? 'text-white' : ''}`} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => console.log('Audio call clicked')}
            title="Audio Call"
          >
            <Phone className={`h-4 w-4 ${theme === 'dark' ? 'text-white' : ''}`} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => console.log('Screen share clicked')}
            title="Screen Share"
          >
            <Monitor className={`h-4 w-4 ${theme === 'dark' ? 'text-white' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-muted/30">
        <div className="p-4">
          {isLoadingMessages ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map(msg => {
                const isOwn = msg.sender.id === dbUserId;
                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={isOwn}
                    onReply={(m: Message) => setReplyContext(m)}
                    onForward={(m: Message) => { setForwardSource(m); setIsForwardOpen(true) }}
                  />
                )
              })}
              <TypingIndicator 
                isTyping={isTyping} 
                userName={typingUser}
              />
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      <div className="flex-shrink-0">
        <MessageInputLocal
          conversationId={conversation.id}
          socket={socket}
          onTyping={handleTyping}
          onOptimisticMessage={addOptimisticMessage}
          disabled={!isConnected}
          dbUserId={dbUserId}
          externalReplyTo={replyContext}
          onClearExternalReply={() => setReplyContext(null)}
        />
      </div>

      {conversation.otherUserId && (
        <UserProfileDrawer
          isOpen={isProfileDrawerOpen}
          onClose={() => setIsProfileDrawerOpen(false)}
          userId={conversation.otherUserId}
          userName={conversation.name}
          userImageUrl={conversation.imageUrl}
          onStartChat={handleStartChat}
          onStartCall={handleStartCall}
          onStartVideoCall={handleStartVideoCall}
        />
      )}

      <Dialog open={isForwardOpen} onOpenChange={setIsForwardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forward message</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Search conversations"
              value={conversationSearch}
              onChange={(e) => setConversationSearch(e.target.value)}
            />
            <div className="max-h-64 overflow-y-auto space-y-2">
              {(allConversations || [])
                .filter((c) => (c.name || '').toLowerCase().includes(conversationSearch.toLowerCase()))
                .map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-md border p-2">
                    <div className="flex items-center gap-2">
                      <img src={c.imageUrl || '/default-avatar.png'} className="h-8 w-8 rounded-full" />
                      <div>
                        <div className="text-sm font-medium">{c.name}</div>
                        {c.lastMessage?.content && (
                          <div className="text-xs text-muted-foreground line-clamp-1">{c.lastMessage.content}</div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (!forwardSource) return
                        try {
                          const body: any = {
                            content: forwardSource.type === 'TEXT' ? forwardSource.content : (forwardSource.fileName || forwardSource.content || ''),
                            type: forwardSource.type,
                            fileUrl: forwardSource.fileUrl,
                            fileName: forwardSource.fileName,
                          }
                          const res = await fetch(`/api/conversations/${c.id}/messages`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(body)
                          })
                          if (res.ok) {
                            setIsForwardOpen(false)
                            setForwardSource(null)
                          }
                        } catch {}
                      }}
                    >
                      Forward
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Spotlight>
  )
}
