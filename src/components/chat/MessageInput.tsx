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

  const handleFileUpload = async (file: File, type: 'IMAGE' | 'FILE') => {
    if (!file || !socket || disabled) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('conversationId', conversationId)
      formData.append('type', type)

      const response = await fetch(`/api/conversations/${conversationId}/upload`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const savedMessage = await response.json()
        onOptimisticMessage(savedMessage.message)
        socket.emit('message:send', savedMessage.message)
        toast.success("File uploaded successfully")
      } else {
        throw new Error('Failed to save file message')
      }
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
    <div className="border-t bg-white p-4">
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
        <div className="absolute bottom-20 left-4 z-50">
          <EmojiPicker 
            onEmojiClick={onEmojiClick}
            theme={Theme.LIGHT}
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
        >
          <Image className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || disabled || isRecording}
          title="Send File"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <div className="flex-1 flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2">
          <Input
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={disabled ? "Connecting..." : "Type a message..."}
            className="flex-1 border-none bg-transparent focus:ring-0"
            disabled={disabled || isUploading || isRecording}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled || isRecording}
          >
            <Smile className="h-5 w-5" />
          </Button>
        </div>

        {message.trim() ? (
          <Button
            onClick={sendMessage}
            disabled={disabled || isUploading || isRecording}
            className="bg-green-500 hover:bg-green-600 rounded-full p-2"
          >
            <Send className="h-5 w-5 text-white" />
          </Button>
        ) : (
          <Button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            disabled={disabled || isUploading}
            className="rounded-full p-2 bg-green-500 hover:bg-green-600"
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
