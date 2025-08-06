'use client'

import { format } from 'date-fns'
import { VoiceMessage } from './VoiceMessage'

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: string
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE'
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
    <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`flex items-end gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isOwn && (
          <img
            src={message.sender.imageUrl || '/default-avatar.png'}
            alt={message.sender.name}
            className="w-8 h-8 rounded-full flex-shrink-0 message-avatar shadow-sm"
          />
        )}
        
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

          {message.type === 'TEXT' && (
            <div className={`text-sm break-words text-left ${isOwn ? 'leading-tight' : 'leading-relaxed'}`}>
              {message.content}
            </div>
          )}

          {message.type === 'IMAGE' && message.fileUrl && (
            <div className="space-y-3">
              <img 
                src={message.fileUrl} 
                alt="shared-img" 
                className="max-w-full h-auto rounded-lg shadow-sm" 
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
      </div>
    </div>
  )
}
