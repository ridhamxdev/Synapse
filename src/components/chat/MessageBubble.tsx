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
    <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`flex items-end gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isOwn && (
          <img
            src={message.sender.imageUrl || '/default-avatar.png'}
            alt={message.sender.name}
            className="w-8 h-8 rounded-full flex-shrink-0"
          />
        )}
        
        <div
          className={
            'relative px-4 py-2 rounded-2xl shadow-sm max-w-full' +
            (isOwn
              ? ' bg-green-500 text-white rounded-br-md'
              : ' bg-white text-gray-900 border border-gray-200 rounded-bl-md'
            )
          }
        >
          {!isOwn && (
            <div className="text-xs font-semibold text-blue-600 mb-1">
              {message.sender.name}
            </div>
          )}

          {message.type === 'TEXT' && (
            <div className="text-sm break-words whitespace-pre-wrap leading-relaxed">
              {message.content}
            </div>
          )}

          {message.type === 'IMAGE' && message.fileUrl && (
            <div className="space-y-2">
              <img 
                src={message.fileUrl} 
                alt="shared-img" 
                className="max-w-full h-auto rounded-lg" 
              />
              {message.content && (
                <div className="text-sm break-words whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </div>
              )}
            </div>
          )}

          {message.type === 'FILE' && (
            <div className="space-y-2">
              <a
                href={message.fileUrl || '#'}
                download={message.fileName || undefined}
                className="flex items-center gap-2 text-sm underline hover:no-underline"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                {message.fileName || 'File'}
              </a>
            </div>
          )}

          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
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
