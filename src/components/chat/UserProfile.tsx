'use client'

import { useState, useRef, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useUserSync } from '@/hooks/useUserSync'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { toast } from 'sonner'
import { Camera, Edit, Save, X, Upload, User, Mail, Phone, Info, Calendar, Hash } from 'lucide-react'

interface UserProfileProps {
  onBack?: () => void
}

interface ProfileData {
  name: string
  bio: string
  phone: string
  email: string
  imageUrl: string
}

export function UserProfile({ onBack }: UserProfileProps) {
  const { user } = useUser()
  const { refreshUser } = useUserSync()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAvatarEditing, setIsAvatarEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<ProfileData>({
    name: user?.fullName || '',
    bio: 'Hey there! I am using WhatsApp Clone.',
    phone: user?.phoneNumbers?.[0]?.phoneNumber || '',
    email: user?.emailAddresses?.[0]?.emailAddress || '',
    imageUrl: user?.imageUrl || '',
  })

  // Load user data from database on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await fetch('/api/users/profile')
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setEditedProfile(prev => ({
              ...prev,
              name: data.user.name || prev.name,
              bio: data.user.bio || prev.bio,
              phone: data.user.phone || prev.phone,
              imageUrl: data.user.imageUrl || prev.imageUrl,
            }))
          }
        }
      } catch (error) {
        console.error('Failed to load user profile:', error)
      }
    }

    loadUserProfile()
  }, [])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editedProfile.name,
          bio: editedProfile.bio,
          phone: editedProfile.phone,
          imageUrl: editedProfile.imageUrl,
        }),
      })

      if (response.ok) {
        setIsEditing(false)
        toast.success('Profile updated successfully')
        // Refresh user data without page reload
        await refreshUser()
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }))
  }

  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size should be less than 5MB')
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setEditedProfile(prev => ({ ...prev, imageUrl: data.url }))
        toast.success('Avatar updated successfully')
      } else {
        throw new Error('Failed to upload image')
      }
    } catch (error) {
      console.error('Avatar upload error:', error)
      toast.error('Failed to upload avatar')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset to original values
    setEditedProfile({
      name: user?.fullName || '',
      bio: 'Hey there! I am using WhatsApp Clone.',
      phone: user?.phoneNumbers?.[0]?.phoneNumber || '',
      email: user?.emailAddresses?.[0]?.emailAddress || '',
      imageUrl: user?.imageUrl || '',
    })
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border/50 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-muted-foreground hover:bg-accent p-2 rounded-full transition-all duration-200"
            >
              ← Back
            </Button>
          )}
          <h2 className="text-xl font-semibold text-foreground">Profile</h2>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-muted-foreground hover:bg-accent px-3 py-1 rounded-full transition-all duration-200 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-8 space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              <Avatar 
                className={`h-28 w-28 cursor-pointer transition-all duration-300 shadow-xl border-4 border-background ${
                  isEditing ? 'hover:scale-105 hover:shadow-2xl' : ''
                }`}
                onClick={handleAvatarClick}
              >
                <AvatarImage src={editedProfile.imageUrl} className="object-cover" />
                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                  {editedProfile.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              
              {isEditing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                    <Camera className="w-7 h-7 text-white" />
                  </div>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            
            {isEditing && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Click avatar to upload image (JPG, PNG, GIF up to 5MB)
                </p>
              </div>
            )}
          </div>

          {/* Profile Information */}
          <div className="space-y-8">
            {/* Name Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <Label htmlFor="name" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Display Name
                </Label>
              </div>
              {isEditing ? (
                <Input
                  id="name"
                  value={editedProfile.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your display name"
                  className="text-lg font-medium border-0 bg-card/50 backdrop-blur-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20"
                />
              ) : (
                <p className="text-2xl font-bold text-foreground">{editedProfile.name}</p>
              )}
            </div>

            {/* Email Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <Mail className="w-5 h-5 text-blue-500" />
                </div>
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Email Address
                </Label>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium text-foreground">{editedProfile.email}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Email cannot be changed for security reasons
                </p>
              </div>
            </div>

            {/* Phone Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-xl">
                  <Phone className="w-5 h-5 text-green-500" />
                </div>
                <Label htmlFor="phone" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Phone Number
                </Label>
              </div>
              {isEditing ? (
                <Input
                  id="phone"
                  value={editedProfile.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter your phone number"
                  className="text-lg font-medium border-0 bg-card/50 backdrop-blur-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500/20"
                />
              ) : (
                <p className="text-lg font-medium text-foreground">
                  {editedProfile.phone || (
                    <span className="text-muted-foreground italic">Not set</span>
                  )}
                </p>
              )}
            </div>

            {/* Bio Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-xl">
                  <Info className="w-5 h-5 text-purple-500" />
                </div>
                <Label htmlFor="bio" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  About Me
                </Label>
              </div>
              {isEditing ? (
                <div className="space-y-3">
                  <Textarea
                    id="bio"
                    value={editedProfile.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="text-lg min-h-[100px] resize-none border-0 bg-card/50 backdrop-blur-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500/20"
                    maxLength={150}
                  />
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Share a bit about yourself</span>
                    <span className="font-mono">{editedProfile.bio.length}/150</span>
                  </div>
                </div>
              ) : (
                <p className="text-lg text-muted-foreground leading-relaxed">{editedProfile.bio}</p>
              )}
            </div>

            {/* Account Information Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
                <div className="p-2 bg-muted rounded-xl">
                  <Hash className="w-5 h-5 text-muted-foreground" />
                </div>
                Account Information
              </h3>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    User ID
                  </Label>
                  <p className="text-sm font-mono text-muted-foreground bg-muted/50 backdrop-blur-sm p-3 rounded-xl">
                    {user?.id}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Member Since
                  </Label>
                  <div className="flex items-center gap-3 bg-muted/50 backdrop-blur-sm p-3 rounded-xl">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex space-x-4 pt-4">
              <Button 
                onClick={handleSave} 
                disabled={isLoading}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                Save Changes
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 border-border hover:bg-accent font-semibold py-3 rounded-xl transition-all duration-200"
              >
                <X className="w-5 h-5 mr-2" />
                Cancel
              </Button>
            </div>
          )}

          {/* Sign Out Section */}
          <div className="pt-4">
            <SignOutButton 
              variant="outline" 
              size="lg"
              className="w-full text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30 font-semibold py-3 rounded-xl transition-all duration-200"
            />
          </div>
        </div>
      </ScrollArea>
    </div>
  )
} 