import React, { useState, useRef, useCallback, Ref, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  FileText, 
  Mic, 
  MicOff, 
  X,
  Smile
} from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import { useUser } from '@clerk/nextjs'
import { Theme } from 'emoji-picker-react'

interface MessageInputProps {
  conversationId: string
  socket: any
  onTyping: (isTyping: boolean) => void
  onOptimisticMessage: (message: any) => void
  disabled?: boolean
  dbUserId?: string | null
  externalReplyTo?: any | null
  onClearExternalReply?: () => void
}

export function MessageInputLocal({
  conversationId,
  socket,
  onTyping,
  onOptimisticMessage,
  disabled,
  dbUserId,
  externalReplyTo,
  onClearExternalReply
}: MessageInputProps) {
  const { user } = useUser()
  const { theme } = useTheme()
  const [message, setMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [replyTo, setReplyTo] = useState<any>(null)

  useEffect(() => {
    if (externalReplyTo) {
      setReplyTo(externalReplyTo)
    }
  }, [externalReplyTo])
  
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const recordingInterval = useRef<NodeJS.Timeout | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)

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
        onClearExternalReply?.()
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

      const response = await fetch(`/api/conversations/${conversationId}/voice`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const savedMessage = await response.json()
        onOptimisticMessage(savedMessage.message)
        socket.emit('message:send', savedMessage.message)
        toast.success("Voice message sent successfully")
      } else {
        throw new Error('Failed to send voice message')
      }
    } catch (error) {
      console.error('Voice upload error:', error)
      toast.error("Failed to send voice message")
    } finally {
      setIsUploading(false)
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
    setMessage(e.target.value)
    onTyping(e.target.value.length > 0)
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
          body: JSON.stringify({ ...messageData, replyToId: replyTo?.id })
        })

        if (messageResponse.ok) {
          const savedMessage = await messageResponse.json()
          onOptimisticMessage(savedMessage.message)
          socket.emit('message:send', savedMessage.message)
          toast.success("Image sent successfully")
          setMessage('')
          setReplyTo(null)
          onClearExternalReply?.()
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
          body: JSON.stringify({ ...messageData, replyToId: replyTo?.id })
        })

        if (messageResponse.ok) {
          const savedMessage = await messageResponse.json()
          onOptimisticMessage(savedMessage.message)
          socket.emit('message:send', savedMessage.message)
          toast.success("File sent successfully")
          setMessage('')
          setReplyTo(null)
          onClearExternalReply?.()
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
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const onEmojiClick = (emojiData: any) => {
    console.log('Emoji clicked:', emojiData.emoji)
    setMessage(prev => prev + emojiData.emoji)
    setShowEmojiPicker(false)
    inputRef.current?.focus()
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (showEmojiPicker && 
          inputRef.current && 
          !inputRef.current.contains(target) &&
          emojiPickerRef.current &&
          !emojiPickerRef.current.contains(target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  return (
    <Card className="p-4 border-t relative">
      {replyTo && (
        <div className="mb-3 p-2 bg-muted rounded-lg relative">
          <div className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-muted-foreground'}`}>
            Replying to: {replyTo.content.substring(0, 50)}...
          </div>
                     <Button
             variant="ghost"
             size="sm"
             className="absolute top-1 right-1 h-6 w-6 p-0"
             onClick={() => setReplyTo(null)}
           >
             <X className={`h-4 w-4 ${theme === 'dark' ? 'text-white' : ''}`} />
           </Button>
        </div>
      )}

      {isRecording && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Recording...</span>
            <Badge variant="secondary">{formatRecordingTime(recordingTime)}</Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={stopRecording}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            Stop
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={inputRef as Ref<HTMLTextAreaElement>}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              onTyping(e.target.value.length > 0)
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className={`min-h-[40px] max-h-[120px] resize-none pr-20 ${
              theme === 'dark' ? 'text-white placeholder-white/70' : ''
            }`}
            disabled={disabled || isUploading}
          />
          
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
                         <Button
               variant="ghost"
               size="sm"
               className="h-8 w-8 p-0"
               onClick={() => {
                 console.log('Emoji button clicked (Local), current state:', showEmojiPicker)
                 setShowEmojiPicker(!showEmojiPicker)
               }}
               disabled={disabled || isUploading}
             >
               <Smile className={`h-4 w-4 ${theme === 'dark' ? 'text-white' : ''}`} />
             </Button>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={disabled || isUploading}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleDocumentUpload}
            className="hidden"
            disabled={disabled || isUploading}
          />

                     <Button
             variant="ghost"
             size="sm"
             className="h-10 w-10 p-0"
             onClick={() => imageInputRef.current?.click()}
             disabled={disabled || isUploading}
           >
             <ImageIcon className={`h-4 w-4 ${theme === 'dark' ? 'text-white' : ''}`} />
           </Button>

                     <Button
             variant="ghost"
             size="sm"
             className="h-10 w-10 p-0"
             onClick={() => fileInputRef.current?.click()}
             disabled={disabled || isUploading}
           >
             <FileText className={`h-4 w-4 ${theme === 'dark' ? 'text-white' : ''}`} />
           </Button>

                     <Button
             variant="ghost"
             size="sm"
             className="h-10 w-10 p-0"
             onClick={isRecording ? stopRecording : startRecording}
             disabled={disabled || isUploading}
           >
             {isRecording ? (
               <MicOff className="h-4 w-4 text-red-500" />
             ) : (
               <Mic className={`h-4 w-4 ${theme === 'dark' ? 'text-white' : ''}`} />
             )}
           </Button>

                     <Button
             onClick={sendMessage}
             disabled={!message.trim() || disabled || isUploading}
             className="h-10 px-4"
           >
             <Send className={`h-4 w-4 ${theme === 'dark' ? 'text-white' : ''}`} />
           </Button>
        </div>
      </div>

      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute bottom-full right-0 mb-2 z-50 emoji-picker-container">
          <EmojiPicker 
            onEmojiClick={onEmojiClick}
            theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
            width={350}
            height={400}
            className="emoji-picker"
          />
        </div>
      )}

      {isUploading && (
        <div className={`mt-2 text-sm ${theme === 'dark' ? 'text-white' : 'text-muted-foreground'}`}>
          Uploading...
        </div>
      )}
    </Card>
  )
} 