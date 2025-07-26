'use client'

import { format } from 'date-fns'

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: string
  type: 'TEXT' | 'IMAGE' | 'FILE'
  fileUrl?: string
  fileName?: string
  isDelivered?: boolean
  isRead?: boolean
  readAt?: string
  sender: {
    id: string
    clerkId: string
    name: string
    imageUrl?: string
  }
}

interface Props {
  message: Message
  isOwn: boolean
}

export default function MessageBubble({ message, isOwn }: Props) {
  const messageTime = format(new Date(message.createdAt), 'HH:mm')

  const getStatusIcon = () => {
    if (!isOwn) return null
    if (message.isRead) return <span className="text-blue-300 text-xs">✓✓</span>
    if (message.isDelivered) return <span className="text-white text-xs opacity-70">✓✓</span>
    return <span className="text-white text-xs opacity-70">✓</span>
  }

  return (
    <div className={`w-full flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-end gap-2 max-w-[75%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isOwn && (
          <img
            src={message.sender.imageUrl || '/default-avatar.png'}
            alt={message.sender.name}
            className="w-8 h-8 rounded-full flex-shrink-0 mb-1"
          />
        )}
        
        <div className={`relative px-3 py-2 rounded-lg shadow-sm ${
          isOwn 
            ? 'bg-green-500 text-white rounded-br-none' 
            : 'bg-white text-gray-900 border rounded-bl-none'
        }`}>
          {!isOwn && (
            <div className="text-xs font-semibold text-blue-600 mb-1">
              {message.sender.name}
            </div>
          )}

          {message.type === 'TEXT' && (
            <div className="text-sm break-words whitespace-pre-wrap">
              {message.content}
            </div>
          )}

          {message.type === 'IMAGE' && message.fileUrl && (
            <div className="space-y-2">
              <img 
                src={message.fileUrl} 
                alt="shared-img" 
                className="max-w-full h-auto rounded mb-2" 
              />
              {message.content && <div className="text-sm break-words">{message.content}</div>}
            </div>
          )}

          {message.type === 'FILE' && (
            <a
              href={message.fileUrl || '#'}
              download={message.fileName || undefined}
              className="text-sm underline hover:no-underline"
            >
              {message.fileName || 'File'}
            </a>
          )}

          <div className="flex items-center justify-end gap-1 mt-1">
            <span className={`text-xs ${isOwn ? 'text-green-100' : 'text-gray-500'}`}>
              {messageTime}
            </span>
            {getStatusIcon()}
          </div>
        </div>
      </div>
    </div>
  )
}
