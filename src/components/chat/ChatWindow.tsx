'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { MessageInput } from '@/components/chat/MessageInput'
import { 
  Phone, 
  Video, 
  MoreVertical, 
  ArrowLeft,
  Shield
} from 'lucide-react'

interface ChatWindowProps {
  conversationId: string | null
  socket: any
}

export function ChatWindow({ conversationId, socket }: ChatWindowProps) {
  const { user } = useUser()
  const [messages, setMessages] = useState<any[]>([])
  const [conversation, setConversation] = useState<any>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!socket || !conversationId) return
    socket.emit('join-conversation', conversationId)
    socket.on('new-message', (message: any) => {
      setMessages((prev: any[]) => [...prev, message])
    })
    socket.on('user-typing', (data: any) => {
      if (data.userId !== user?.id) {
        setTypingUsers((prev: string[]) => [...prev.filter(id => id !== data.userId), data.userId])
        setTimeout(() => {
          setTypingUsers((prev: string[]) => prev.filter(id => id !== data.userId))
        }, 3000)
      }
    })
    socket.on('message-read', (data: any) => {
      setMessages((prev: any[]) =>
        prev.map(msg =>
          msg.id === data.messageId
            ? { ...msg, readBy: [...(msg.readBy || []), data.userId] }
            : msg
        )
      )
    })

    return () => {
      socket.off('new-message')
      socket.off('user-typing')
      socket.off('message-read')
    }
  }, [socket, conversationId, user?.id])

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-64 h-64 mx-auto mb-8 opacity-20">
            <Shield className="w-full h-full" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            Keep your phone connected
          </h3>
          <p className="text-gray-500 max-w-md">
            WhatsApp connects to your phone to sync messages. To reduce data usage, connect your phone to Wi-Fi.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={conversation?.imageUrl} />
              <AvatarFallback>
                {conversation?.name?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{conversation?.name}</h3>
              <p className="text-sm text-gray-500">
                {typingUsers.length > 0 
                  ? `${typingUsers.length} user${typingUsers.length > 1 ? 's' : ''} typing...`
                  : conversation?.isOnline 
                    ? 'Online' 
                    : `Last seen ${conversation?.lastSeen}`
                }
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 py-4">
        <div className="space-y-4">
          {messages.map((message: any) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === user?.id}
              showAvatar={!message.isOwn}
            />
          ))}
          {typingUsers.length > 0 && (
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <span className="text-sm text-gray-500">Typing...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <MessageInput
        conversationId={conversationId}
        socket={socket}
        onTyping={(isTyping: boolean) => {
          socket?.emit('typing', {
            conversationId,
            userId: user?.id,
            isTyping
          })
        }}
      />
    </div>
  )
}
