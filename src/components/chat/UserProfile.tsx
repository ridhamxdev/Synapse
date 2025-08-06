'use client'

import { useState, useRef, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useUserSync } from '@/hooks/useUserSync'
import { useTheme } from '@/contexts/ThemeContext'
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
  const { theme } = useTheme()
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
        
        // Immediately update the profile with the new image
        const profileResponse = await fetch('/api/users/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editedProfile.name,
            bio: editedProfile.bio,
            phone: editedProfile.phone,
            imageUrl: data.url,
          }),
        })

        if (profileResponse.ok) {
          toast.success('Avatar updated successfully')
          // Refresh user data to reflect changes
          await refreshUser()
        } else {
          throw new Error('Failed to update profile with new image')
        }
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
    <div className={`h-full flex flex-col transition-colors duration-300 ${
      theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'
    }`}>
      {/* Header */}
      <div className={`backdrop-blur-sm border-b p-4 flex-shrink-0 transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-slate-800/80 border-slate-700/50' 
          : 'bg-white/80 border-slate-200/50'
      }`}>
        <div className="flex items-center justify-between">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className={`p-2 rounded-full transition-all duration-200 ${
                theme === 'dark'
                  ? 'text-slate-300 hover:bg-slate-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              ← Back
            </Button>
          )}
          <h2 className={`text-xl font-semibold transition-colors duration-300 ${
            theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
          }`}>Profile</h2>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className={`px-3 py-1 rounded-full transition-all duration-200 flex items-center gap-2 ${
                theme === 'dark'
                  ? 'text-slate-300 hover:bg-slate-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1 h-full">
        <div className="p-8 pb-32 space-y-8 min-h-full">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
                         <div className="relative group">
               <Avatar 
                 className={`h-28 w-28 transition-all duration-300 shadow-xl border-4 ${
                   theme === 'dark' ? 'border-slate-800' : 'border-white'
                 } ${
                   isEditing ? 'cursor-pointer hover:scale-105 hover:shadow-2xl' : 'cursor-default'
                 }`}
                 onClick={handleAvatarClick}
               >
                <AvatarImage src={editedProfile.imageUrl} className="object-cover" />
                <AvatarFallback className={`text-3xl font-bold ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                    : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                }`}>
                  {editedProfile.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              
                             {isEditing && (
                 <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300">
                   <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                     {isLoading ? (
                       <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
                     ) : (
                       <Camera className="w-7 h-7 text-white" />
                     )}
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
                <p className={`text-sm transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
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
                <div className={`p-2 rounded-xl ${
                  theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-500/10'
                }`}>
                  <User className={`w-5 h-5 ${
                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <Label htmlFor="name" className={`text-sm font-semibold uppercase tracking-wide transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Display Name
                </Label>
              </div>
              {isEditing ? (
                <Input
                  id="name"
                  value={editedProfile.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your display name"
                  className={`text-lg font-medium border-0 backdrop-blur-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 transition-colors duration-300 ${
                    theme === 'dark' 
                      ? 'bg-slate-800/50 text-slate-100 placeholder-slate-400' 
                      : 'bg-white/50 text-slate-900 placeholder-slate-500'
                  }`}
                />
              ) : (
                <p className={`text-2xl font-bold transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                }`}>{editedProfile.name}</p>
              )}
            </div>

            {/* Email Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-500/10'
                }`}>
                  <Mail className={`w-5 h-5 ${
                    theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                  }`} />
                </div>
                <Label className={`text-sm font-semibold uppercase tracking-wide transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Email Address
                </Label>
              </div>
              <div className="space-y-2">
                <p className={`text-lg font-medium transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                }`}>{editedProfile.email}</p>
                <p className={`text-sm flex items-center gap-2 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  <Info className="w-4 h-4" />
                  Email cannot be changed for security reasons
                </p>
              </div>
            </div>

            {/* Phone Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  theme === 'dark' ? 'bg-orange-500/20' : 'bg-orange-500/10'
                }`}>
                  <Phone className={`w-5 h-5 ${
                    theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                  }`} />
                </div>
                <Label htmlFor="phone" className={`text-sm font-semibold uppercase tracking-wide transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Phone Number
                </Label>
              </div>
              {isEditing ? (
                <Input
                  id="phone"
                  value={editedProfile.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter your phone number"
                  className={`text-lg font-medium border-0 backdrop-blur-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500/20 transition-colors duration-300 ${
                    theme === 'dark' 
                      ? 'bg-slate-800/50 text-slate-100 placeholder-slate-400' 
                      : 'bg-white/50 text-slate-900 placeholder-slate-500'
                  }`}
                />
              ) : (
                <p className={`text-lg font-medium transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                }`}>
                  {editedProfile.phone || (
                    <span className={`italic transition-colors duration-300 ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>Not set</span>
                  )}
                </p>
              )}
            </div>

            {/* Bio Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-500/10'
                }`}>
                  <Info className={`w-5 h-5 ${
                    theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                </div>
                <Label htmlFor="bio" className={`text-sm font-semibold uppercase tracking-wide transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>
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
                    className={`text-lg min-h-[100px] resize-none border-0 backdrop-blur-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500/20 transition-colors duration-300 ${
                      theme === 'dark' 
                        ? 'bg-slate-800/50 text-slate-100 placeholder-slate-400' 
                        : 'bg-white/50 text-slate-900 placeholder-slate-500'
                    }`}
                    maxLength={150}
                  />
                  <div className={`flex justify-between items-center text-sm transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    <span>Share a bit about yourself</span>
                    <span className="font-mono">{editedProfile.bio.length}/150</span>
                  </div>
                </div>
              ) : (
                <p className={`text-lg leading-relaxed transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                }`}>{editedProfile.bio}</p>
              )}
            </div>

            {/* Account Information Section */}
            <div className="space-y-6">
              <h3 className={`text-xl font-bold flex items-center gap-3 transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
              }`}>
                <div className={`p-2 rounded-xl ${
                  theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'
                }`}>
                  <Hash className={`w-5 h-5 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`} />
                </div>
                Account Information
              </h3>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className={`text-sm font-semibold uppercase tracking-wide transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    User ID
                  </Label>
                  <p className={`text-sm font-mono backdrop-blur-sm p-3 rounded-xl transition-colors duration-300 ${
                    theme === 'dark' 
                      ? 'text-slate-400 bg-slate-800/50' 
                      : 'text-slate-600 bg-slate-100/50'
                  }`}>
                    {user?.id}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className={`text-sm font-semibold uppercase tracking-wide transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    Member Since
                  </Label>
                  <div className={`flex items-center gap-3 backdrop-blur-sm p-3 rounded-xl transition-colors duration-300 ${
                    theme === 'dark' 
                      ? 'bg-slate-800/50' 
                      : 'bg-slate-100/50'
                  }`}>
                    <Calendar className={`w-4 h-4 ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`} />
                    <p className={`text-sm transition-colors duration-300 ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                    }`}>
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
            <div className="flex space-x-4 pt-6">
              <Button 
                onClick={handleSave} 
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                Save Changes
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={isLoading}
                className={`flex-1 font-semibold py-3 rounded-xl transition-all duration-200 ${
                  theme === 'dark'
                    ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                    : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
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
              className={`w-full font-semibold py-3 rounded-xl transition-all duration-200 ${
                theme === 'dark'
                  ? 'text-red-400 border-red-800 hover:bg-red-900/20 hover:border-red-700'
                  : 'text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300'
              }`}
            />
          </div>
        </div>
      </ScrollArea>
    </div>
  )
} 