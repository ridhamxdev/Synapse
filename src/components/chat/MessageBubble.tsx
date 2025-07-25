'use client'

import { format } from 'date-fns'

interface Message {
  id: string
  content: string
  type: 'TEXT' | 'IMAGE' | 'FILE'
  senderId: string
  createdAt: string
  fileUrl?: string
  fileName?: string
  sender: {
    id: string
    name: string
    imageUrl?: string
  }
}

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div className={`flex w-full mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-end ${isOwn ? 'flex-row-reverse' : ''}`}>
        {!isOwn && (
          <img
            src={message.sender.imageUrl || '/default-avatar.png'}
            alt={message.sender.name}
            className="w-8 h-8 rounded-full mr-2"
          />
        )}
        <div className={
          `px-4 py-2 rounded-lg shadow max-w-xs break-words ` +
          (isOwn
            ? 'bg-green-500 text-white rounded-br-none'
            : 'bg-white text-gray-800 border rounded-bl-none shadow-sm')
        }>
          {!isOwn && (
            <p className="text-xs font-semibold text-gray-600 mb-1">
              {message.sender.name}
            </p>
          )}
          {message.type === 'TEXT' && (
            <p className="text-sm break-words">{message.content}</p>
          )}
          {message.type === 'IMAGE' && message.fileUrl && (
            <div className="space-y-2">
              <img 
                src={message.fileUrl} 
                alt="Shared image" 
                className="max-w-full h-auto rounded"
              />
              {message.content && (
                <p className="text-sm break-words">{message.content}</p>
              )}
            </div>
          )}
          {message.type === 'FILE' && (
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <p className="text-sm font-medium">{message.fileName}</p>
                <p className="text-xs opacity-75">{message.content}</p>
              </div>
              {message.fileUrl && (
                <a 
                  href={message.fileUrl} 
                  download={message.fileName}
                  className="text-xs underline"
                >
                  Download
                </a>
              )}
            </div>
          )}
          <p className={`text-xs mt-1 ${isOwn ? 'text-green-100' : 'text-gray-500'}`}>
            {format(new Date(message.createdAt), 'HH:mm')}
          </p>
        </div>
      </div>
    </div>
  )
}
