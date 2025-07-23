'use client'

import { useState, useRef, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { 
  Send, 
  Paperclip, 
  Mic, 
  Image, 
  Smile,
  X,
  File
} from 'lucide-react'
import EmojiPicker, { Theme } from 'emoji-picker-react'

interface MessageInputProps {
  conversationId: string
  socket: any
  onTyping: (isTyping: boolean) => void
}

export function MessageInput({ conversationId, socket, onTyping }: MessageInputProps) {
  const { user } = useUser()
  const [message, setMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [replyTo, setReplyTo] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const sendMessage = useCallback(async () => {
    if (!message.trim() || !socket) return

    try {
      const messageData = {
        conversationId,
        content: message.trim(),
        type: 'TEXT',
        senderId: user?.id,
        replyToId: replyTo?.id,
        timestamp: new Date().toISOString(),
      }

      socket.emit('send-message', messageData)
      setMessage('')
      setReplyTo(null)
      onTyping(false)
      
      // Focus back to input
      inputRef.current?.focus()
      
    } catch (error) {
      toast.error("Failed to send message")
      console.error('Failed to send message:', error)
    }
  }, [message, socket, conversationId, user?.id, replyTo, onTyping])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMessage(value)
    onTyping(value.length > 0)
  }

  const handleFileUpload = async (file: File, type: 'IMAGE' | 'FILE') => {
    if (!file || !socket) return

    setIsUploading(true)
    
    try {
      // Create a simple file URL (in real app, upload to cloud storage)
      const fileUrl = URL.createObjectURL(file)
      
      const messageData = {
        conversationId,
        content: '',
        type,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        senderId: user?.id,
        timestamp: new Date().toISOString(),
      }

      socket.emit('send-message', messageData)
      toast.success("File uploaded successfully")
      
    } catch (error) {
      toast.error("Failed to upload file")
      console.error('File upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file, 'IMAGE')
    }
  }

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file, 'FILE')
    }
  }

  const onEmojiClick = (emojiData: any) => {
    setMessage(prev => prev + emojiData.emoji)
    setShowEmojiPicker(false)
    inputRef.current?.focus()
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Reply Preview */}
      {replyTo && (
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-1 h-8 bg-blue-500 rounded"></div>
              <div>
                <p className="text-xs text-blue-600 font-medium">
                  Replying to {replyTo.sender.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                  {replyTo.content}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyTo(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 right-4 z-50">
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            autoFocusSearch={false}
            theme={Theme.AUTO}
          />
        </div>
      )}

      {/* Input Area */}
      <div className="p-4">
        <div className="flex items-end space-x-2">
          {/* Attachment Options */}
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => imageInputRef.current?.click()}
              disabled={isUploading}
              title="Send Image"
            >
              <Image className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title="Send File"
            >
              <File className="h-5 w-5" />
            </Button>
          </div>

          {/* Message Input */}
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="pr-10 resize-none"
              disabled={isUploading}
              autoComplete="off"
            />
            
            {/* Emoji Button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>

          {/* Send/Voice Button */}
          {message.trim() ? (
            <Button 
              onClick={sendMessage} 
              disabled={isUploading}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              size="sm"
              title="Voice Message"
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={imageInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleImageUpload}
        />
        
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.zip,.rar"
          onChange={handleDocumentUpload}
        />
      </div>
    </div>
  )
}
