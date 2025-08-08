'use client'

import { format } from 'date-fns'
import { VoiceMessage } from './VoiceMessage'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { CornerUpLeft, Forward, MoreVertical } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react'
import { useTheme } from '@/contexts/ThemeContext'

interface Reaction {
  id: string
  emoji: string
  userId: string
}

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: string
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE'
  conversationId?: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  isDelivered?: boolean
  isRead?: boolean
  readAt?: string
  sender: {
    id: string
    clerkId: string
    name: string
    imageUrl?: string
  }
  replyTo?: {
    id: string
    content: string
    sender?: {
      name?: string
    }
  }
  reactions?: Reaction[]
}

interface Props {
  message: Message
  isOwn: boolean
  onReply?: (message: any) => void
  onForward?: (message: any) => void
}

export default function MessageBubble({ message, isOwn, onReply, onForward }: Props) {
  const messageTime = format(new Date(message.createdAt), 'HH:mm')
  const [reactions, setReactions] = useState<Reaction[]>(() => (message as any).reactions || [])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const { theme } = useTheme()
  const pickerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false)
      }
    }
    if (showEmojiPicker) document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [showEmojiPicker])

  const getStatusIcon = () => {
    if (!isOwn) return null
    if (message.isRead) return <span className="text-blue-300 text-xs">✓✓</span>
    if (message.isDelivered) return <span className="text-white text-xs opacity-70">✓✓</span>
    return <span className="text-white text-xs opacity-70">✓</span>
  }

  return (
    <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`group flex items-end gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isOwn && (
          <img
            src={message.sender.imageUrl || '/default-avatar.png'}
            alt={message.sender.name}
            className="w-8 h-8 rounded-full flex-shrink-0 message-avatar shadow-sm"
          />
        )}
        
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          <div
            className={
              'relative rounded-2xl shadow-sm max-w-full message-bubble ' +
              (isOwn ? 'own px-3 py-2' : 'other px-4 py-3')
            }
          >
          {!isOwn && (
            <div className="text-xs font-semibold text-blue-600 mb-3 opacity-90">
              {message.sender.name}
            </div>
          )}

          {message.replyTo && (
            <div className={`mb-2 pl-3 border-l-2 ${isOwn ? 'border-white/40' : 'border-gray-300'} text-xs`}>
              <div className={`font-semibold ${isOwn ? 'text-white/80' : 'text-gray-700'}`}>
                {message.replyTo.sender?.name || 'Message'}
              </div>
              <div className={`${isOwn ? 'text-white/80' : 'text-gray-600'} line-clamp-2`}>
                {message.replyTo.content}
              </div>
            </div>
          )}

          {message.type === 'TEXT' && (
            <div className={`text-sm break-words text-left ${isOwn ? 'leading-tight' : 'leading-relaxed'}`}>
              {message.content}
            </div>
          )}

          {message.type === 'IMAGE' && message.fileUrl && (
            <div className="space-y-2">
              <img
                src={message.fileUrl}
                alt="image"
                className="rounded-lg shadow-sm max-w-[240px] max-h-[320px] w-auto h-auto object-contain"
              />
              {message.content && (
                <div className={`text-sm break-words text-left ${isOwn ? 'leading-tight' : 'leading-relaxed'}`}>
                  {message.content}
                </div>
              )}
            </div>
          )}

          {message.type === 'FILE' && (
            <div className="space-y-2 text-left">
              <a
                href={message.fileUrl || '#'}
                download={message.fileName || undefined}
                className="flex items-center gap-2 text-sm underline hover:no-underline transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1-414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                {message.fileName || 'File'}
              </a>
            </div>
          )}

          {message.type === 'VOICE' && message.fileUrl && (
            <VoiceMessage
              fileUrl={message.fileUrl}
              content={message.content}
              fileSize={message.fileSize}
              isOwn={isOwn}
            />
          )}

            <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className={`text-xs ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
              {messageTime}
            </span>
            {getStatusIcon()}
            </div>
          </div>

          {reactions && reactions.length > 0 && (
            <div className={`mt-1 flex flex-wrap gap-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              {Object.values(
                reactions.reduce((acc: Record<string, { emoji: string; count: number }>, r) => {
                  if (!acc[r.emoji]) acc[r.emoji] = { emoji: r.emoji, count: 0 }
                  acc[r.emoji].count += 1
                  return acc
                }, {})
              ).map(({ emoji, count }) => (
                <span
                  key={emoji}
                  className={`text-xs px-2 py-0.5 rounded-full border ${isOwn ? 'bg-white/10 text-white border-white/20' : 'bg-black/5 text-black/80 border-black/10'}`}
                >
                  {emoji} {count}
                </span>
              ))}
            </div>
          )}

          <div className={`mt-1 ${isOwn ? 'justify-end' : 'justify-start'} flex opacity-0 group-hover:opacity-100 transition-opacity`}> 
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-2 py-0 text-xs ${isOwn ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-black/5'}`}
              onClick={() => setShowEmojiPicker((v) => !v)}
            >
              😀 Add reaction
            </Button>
          </div>

          {showEmojiPicker && (
            <div ref={pickerRef} className={`mt-2 z-50 ${isOwn ? 'self-end' : 'self-start'}`}>
              <EmojiPicker
                theme={theme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                width={320}
                height={380}
                onEmojiClick={async (emojiData) => {
                  try {
                    const res = await fetch(`/api/conversations/${message.conversationId || ''}/messages/${message.id}`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ emoji: (emojiData as any).emoji })
                    })
                    if (res.ok) {
                      const data = await res.json()
                      setReactions(data.reactions || [])
                    }
                  } finally {
                    setShowEmojiPicker(false)
                  }
                }}
              />
            </div>
          )}
        </div>

        <div className={`mb-1 ${isOwn ? 'mr-1' : 'ml-1'} opacity-0 group-hover:opacity-100 transition-opacity`}> 
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-70 hover:opacity-100 rounded-full">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side={isOwn ? 'left' : 'right'}>
              <DropdownMenuItem onClick={() => onReply?.(message)}>
                <CornerUpLeft className="mr-2 h-4 w-4" /> Reply
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onForward?.(message)}>
                <Forward className="mr-2 h-4 w-4" /> Forward
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
