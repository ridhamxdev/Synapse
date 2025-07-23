'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  MoreVertical, 
  Reply, 
  Copy, 
  Trash2,
  Edit,
  Download,
  Eye,
  EyeOff
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface MessageBubbleProps {
  message: {
    id: string
    content?: string
    type: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT'
    fileUrl?: string
    fileName?: string
    senderId: string
    createdAt: string
    isEdited?: boolean
    isDeleted?: boolean
    sender: {
      id: string
      name: string
      imageUrl?: string
    }
    readBy?: string[]
    replyTo?: {
      id: string
      content: string
      sender: {
        name: string
      }
    }
  }
  isOwn: boolean
  showAvatar?: boolean
}

export function MessageBubble({ message, isOwn, showAvatar = true }: MessageBubbleProps) {
  const [showOptions, setShowOptions] = useState(false)

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const renderMessageContent = () => {
    if (message.isDeleted) {
      return (
        <div className="italic text-gray-500 flex items-center">
          <EyeOff className="h-4 w-4 mr-2" />
          This message was deleted
        </div>
      )
    }

    switch (message.type) {
      case 'IMAGE':
        return (
          <div className="space-y-2">
            {message.fileUrl && (
              <img 
                src={message.fileUrl} 
                alt="Shared image"
                className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(message.fileUrl, '_blank')}
              />
            )}
            {message.content && (
              <p className="text-sm">{message.content}</p>
            )}
          </div>
        )

      case 'FILE':
      case 'DOCUMENT':
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Download className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {message.fileName || 'Document'}
              </p>
              <p className="text-xs text-gray-500">
                Click to download
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(message.fileUrl, '_blank')}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        )

      case 'AUDIO':
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <Button variant="ghost" size="sm">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                ▶️
              </div>
            </Button>
            <div className="flex-1">
              <div className="h-2 bg-gray-300 rounded-full">
                <div className="h-2 bg-green-500 rounded-full w-1/3"></div>
              </div>
            </div>
            <span className="text-xs text-gray-500">0:30</span>
          </div>
        )

      default:
        return (
          <div>
            {message.replyTo && (
              <div className="mb-2 p-2 border-l-4 border-blue-500 bg-gray-50 dark:bg-gray-700 rounded">
                <p className="text-xs text-blue-600 font-medium">
                  {message.replyTo.sender.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                  {message.replyTo.content}
                </p>
              </div>
            )}
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
        )
    }
  }

  return (
    <div
      className={cn(
        "flex space-x-3 group",
        isOwn ? "justify-end" : "justify-start"
      )}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      {/* Avatar for received messages */}
      {!isOwn && showAvatar && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={message.sender.imageUrl} />
          <AvatarFallback className="text-xs">
            {message.sender.name[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message bubble */}
      <div
        className={cn(
          "max-w-xs lg:max-w-md px-4 py-2 rounded-2xl relative",
          isOwn
            ? "bg-blue-500 text-white rounded-br-md"
            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md",
          "shadow-sm"
        )}
      >
        {/* Sender name for group chats */}
        {!isOwn && (
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
            {message.sender.name}
          </p>
        )}

        {/* Message content */}
        {renderMessageContent()}

        {/* Message time and status */}
        <div className={cn(
          "flex items-center justify-end space-x-1 mt-1",
          isOwn ? "text-blue-100" : "text-gray-500"
        )}>
          <span className="text-xs">
            {formatTime(message.createdAt)}
          </span>
          {message.isEdited && (
            <span className="text-xs opacity-70">edited</span>
          )}
          {isOwn && (
            <div className="flex">
              {message.readBy && message.readBy.length > 0 ? (
                <div className="text-blue-200">✓✓</div>
              ) : (
                <div className="text-blue-200">✓</div>
              )}
            </div>
          )}
        </div>

        {/* Message options */}
        {showOptions && (
          <div className={cn(
            "absolute top-0 flex space-x-1",
            isOwn ? "-left-20" : "-right-20"
          )}>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              <Reply className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Spacer for sent messages to maintain alignment */}
      {isOwn && <div className="w-8 flex-shrink-0" />}
    </div>
  )
}
