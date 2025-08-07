'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useTheme } from '@/contexts/ThemeContext'
import {
  Send,
  Paperclip,
  Mic,
  Image,
  Smile,
  Square,
  X
} from 'lucide-react'
import EmojiPicker, { Theme } from 'emoji-picker-react'

interface MessageInputProps {
  conversationId: string
  socket: any
  onTyping: (isTyping: boolean) => void
  onOptimisticMessage: (message: any) => void
  disabled?: boolean
}

export function MessageInput({
  conversationId,
  socket,
  onTyping,
  onOptimisticMessage,
  disabled
}: MessageInputProps) {
  const { user } = useUser()
  const { theme } = useTheme()
  const [message, setMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [replyTo, setReplyTo] = useState<any>(null)
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const recordingInterval = useRef<NodeJS.Timeout | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)

  // Local upload functions

  const sendMessage = useCallback(async () => {
    if (!message.trim() || !socket || disabled || !user?.id) return

    const messageContent = message.trim()
    setMessage('')
    onTyping(false)

    try {
      const messageData = {
        conversationId,
        content: messageContent,
        type: 'TEXT',
        senderId: user.id,
        replyToId: replyTo?.id,
        timestamp: new Date().toISOString(),
      }

      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      })

      if (response.ok) {
        const savedMessage = await response.json()
        onOptimisticMessage(savedMessage.message)
        socket.emit('message:send', savedMessage.message)
        setReplyTo(null)
        inputRef.current?.focus()
      } else {
        throw new Error('Failed to save message')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error("Failed to send message")
      setMessage(messageContent)
    }
  }, [message, socket, conversationId, user?.id, replyTo, onTyping, onOptimisticMessage, disabled])

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' })
        handleVoiceUpload(audioBlob)
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setRecordingTime(0)

      recordingInterval.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      toast.error('Microphone access denied')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      mediaRecorder.stream.getTracks().forEach(track => track.stop())
      
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current)
        recordingInterval.current = null
      }
    }
  }

  const handleVoiceUpload = async (audioBlob: Blob) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'voice-message.webm')
      formData.append('conversationId', conversationId)
      formData.append('type', 'VOICE')
      formData.append('duration', recordingTime.toString())

      const response = await fetch(`/api/conversations/${conversationId}/voice`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const savedMessage = await response.json()
        onOptimisticMessage(savedMessage.message)
        socket.emit('message:send', savedMessage.message)
        toast.success("Voice message sent")
      } else {
        throw new Error('Failed to save voice message')
      }
    } catch (error) {
      toast.error("Failed to send voice message")
      console.error('Voice upload error:', error)
    } finally {
      setIsUploading(false)
      setRecordingTime(0)
    }
  }

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !socket || disabled) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        const fileUrl = result.url
        const fileName = result.name
        
        // Create message with image
        const messageData = {
          conversationId,
          content: message || 'Image',
          type: 'IMAGE',
          senderId: user?.id,
          fileUrl,
          fileName,
          timestamp: new Date().toISOString(),
        }

        const messageResponse = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messageData)
        })

        if (messageResponse.ok) {
          const savedMessage = await messageResponse.json()
          onOptimisticMessage(savedMessage.message)
          socket.emit('message:send', savedMessage.message)
          toast.success("Image sent successfully")
          setMessage('')
        } else {
          throw new Error('Failed to save image message')
        }
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }
    } catch (error) {
      toast.error("Failed to upload image")
      console.error('Image upload error:', error)
    } finally {
      setIsUploading(false)
      // Reset file input
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
    }
  }

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !socket || disabled) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        const fileUrl = result.url
        const fileName = result.name
        
        // Create message with file
        const messageData = {
          conversationId,
          content: message || fileName,
          type: 'FILE',
          senderId: user?.id,
          fileUrl,
          fileName,
          timestamp: new Date().toISOString(),
        }

        const messageResponse = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messageData)
        })

        if (messageResponse.ok) {
          const savedMessage = await messageResponse.json()
          onOptimisticMessage(savedMessage.message)
          socket.emit('message:send', savedMessage.message)
          toast.success("File sent successfully")
          setMessage('')
        } else {
          throw new Error('Failed to save file message')
        }
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }
    } catch (error) {
      toast.error("Failed to upload file")
      console.error('File upload error:', error)
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const onEmojiClick = (emojiData: any) => {
    console.log('Emoji clicked:', emojiData.emoji)
    console.log('Emoji data:', emojiData)
    setMessage(prev => prev + emojiData.emoji)
    setShowEmojiPicker(false)
    inputRef.current?.focus()
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      console.log('Click outside handler triggered', {
        showEmojiPicker,
        target: target,
        inputRef: inputRef.current,
        emojiPickerRef: emojiPickerRef.current,
        isInputClick: inputRef.current?.contains(target),
        isEmojiPickerClick: emojiPickerRef.current?.contains(target)
      });
      
      if (showEmojiPicker && 
          inputRef.current && 
          !inputRef.current.contains(target) &&
          emojiPickerRef.current &&
          !emojiPickerRef.current.contains(target)) {
        console.log('Closing emoji picker due to outside click');
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  return (
    <div className="border-t bg-white p-4 relative">
      {replyTo && (
        <div className="mb-2 p-2 bg-gray-100 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-600">
              Replying to {replyTo.sender.name}
            </p>
            <p className="text-sm text-gray-800 truncate">{replyTo.content}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReplyTo(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute bottom-full left-0 mb-2 z-50 emoji-picker-container">
          <EmojiPicker 
            onEmojiClick={onEmojiClick}
            theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
            width={350}
            height={400}
            className="emoji-picker"
          />
        </div>
      )}

      {isRecording && (
        <div className="mb-2 p-3 bg-red-50 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-red-700">
              Recording: {formatRecordingTime(recordingTime)}
            </span>
          </div>
          <Button
            onClick={stopRecording}
            size="sm"
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <Square className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-end space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => imageInputRef.current?.click()}
          disabled={isUploading || disabled || isRecording}
          title="Send Image"
          className="p-2"
        >
          {isUploading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
          ) : (
            <Image className="h-5 w-5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || disabled || isRecording}
          title="Send File"
          className="p-2"
        >
          {isUploading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
          ) : (
            <Paperclip className="h-5 w-5" />
          )}
        </Button>

        <div className="flex-1 flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2 min-h-[44px]">
          <Input
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={disabled ? "Connecting..." : "Type a message..."}
            className="flex-1 border-none bg-transparent text-gray-900 focus:ring-0 text-sm"
            disabled={disabled || isUploading || isRecording}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              console.log('Emoji button clicked, current state:', showEmojiPicker)
              setShowEmojiPicker(!showEmojiPicker)
            }}
            disabled={disabled || isRecording}
            className="p-2"
          >
            <Smile className="h-5 w-5" />
          </Button>
        </div>

        {message.trim() ? (
          <Button
            onClick={sendMessage}
            disabled={disabled || isUploading || isRecording}
            className="bg-green-500 hover:bg-green-600 rounded-full p-2 min-w-[44px] min-h-[44px]"
          >
            <Send className="h-5 w-5 text-white" />
          </Button>
        ) : (
          <Button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            disabled={disabled || isUploading}
            className="rounded-full p-2 bg-green-500 hover:bg-green-600 min-w-[44px] min-h-[44px]"
          >
            <Mic className="h-5 w-5 text-white" />
          </Button>
        )}
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleDocumentUpload}
        className="hidden"
      />
    </div>
  )
}
