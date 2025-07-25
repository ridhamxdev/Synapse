'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { toast } from 'sonner'

interface UserProfileProps {
  onBack?: () => void
}

export function UserProfile({ onBack }: UserProfileProps) {
  const { user } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState({
    name: user?.fullName || '',
    bio: 'Hey there! I am using WhatsApp Clone.',
    phone: user?.phoneNumbers?.[0]?.phoneNumber || '',
    email: user?.emailAddresses?.[0]?.emailAddress || '',
  })

  const handleSave = async () => {
    try {
      setIsEditing(false)
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error('Failed to update profile')
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="h-full bg-white">
      <div className="bg-green-500 text-white p-6">
        <div className="flex items-center space-x-4 mb-4">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-white hover:bg-green-600 p-2"
            >
              Back
            </Button>
          )}
          <h2 className="text-xl font-semibold">Profile</h2>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback className="text-2xl">
                  {user?.firstName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0"
              >
                Edit
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-600">
              Name
            </Label>
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <Input
                  id="name"
                  value={editedProfile.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="flex-1"
                />
                <Button size="sm" onClick={handleSave}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-lg">{editedProfile.name}</span>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-600">Email</Label>
            <p className="text-lg">{editedProfile.email}</p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-600">Phone</Label>
            <p className="text-lg">{editedProfile.phone || 'Not set'}</p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-600">About</Label>
            <p className="text-lg text-gray-800">{editedProfile.bio}</p>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Account</h3>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">User ID</Label>
              <p className="text-sm text-gray-500 font-mono">{user?.id}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Member Since</Label>
              <p className="text-sm text-gray-500">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <Separator />

          <div className="pt-4">
            <SignOutButton 
              variant="outline" 
              size="md"
              className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            />
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
