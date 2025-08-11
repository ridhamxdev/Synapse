'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useTheme } from '@/contexts/ThemeContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  X, 
  Users, 
  Settings,
  UserPlus,
  Crown,
  Shield,
  Edit,
  Trash2
} from 'lucide-react'

interface GroupInfoDrawerProps {
  isOpen: boolean
  onClose: () => void
  group: {
    id: string
    name: string
    imageUrl?: string
    participants: Array<{
      id: string
      name: string
      imageUrl?: string
    }>
  }
}

interface GroupMember {
  id: string
  name: string
  imageUrl?: string
  role: 'ADMIN' | 'MEMBER'
  joinedAt: string
}

export function GroupInfoDrawer({ isOpen, onClose, group }: GroupInfoDrawerProps) {
  const { user } = useUser()
  const { theme } = useTheme()
  const [members, setMembers] = useState<GroupMember[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [groupName, setGroupName] = useState(group.name)
  const [groupImage, setGroupImage] = useState(group.imageUrl || '')

  useEffect(() => {
    if (isOpen && group.id) {
      loadGroupMembers()
    }
  }, [isOpen, group.id])

  const loadGroupMembers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/groups/${group.id}/members`)
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
      }
    } catch (error) {
      console.error('Failed to load group members:', error)
      toast.error('Failed to load group members')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveChanges = async () => {
    try {
      const response = await fetch(`/api/groups/${group.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName.trim(),
          imageUrl: groupImage.trim() || undefined
        })
      })

      if (response.ok) {
        toast.success('Group updated successfully!')
        setIsEditing(false)
        // Refresh group data
        onClose()
      } else {
        toast.error('Failed to update group')
      }
    } catch (error) {
      console.error('Update failed:', error)
      toast.error('Network error while updating group')
    }
  }

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return

    try {
      const response = await fetch(`/api/groups/${group.id}/leave`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Left group successfully')
        onClose()
      } else {
        toast.error('Failed to leave group')
      }
    } catch (error) {
      console.error('Leave group failed:', error)
      toast.error('Network error while leaving group')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`w-full max-w-md mx-4 rounded-lg shadow-xl transition-colors duration-300 ${
        theme === 'dark' ? 'bg-slate-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b transition-colors duration-300 ${
          theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
        }`}>
          <h2 className={`text-lg font-semibold transition-colors duration-300 ${
            theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
          }`}>Group Info</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Group Details */}
        <div className="p-6 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {group.imageUrl ? (
                <Avatar className="h-16 w-16">
                  <AvatarImage src={group.imageUrl} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                    <Users className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
              )}
              {isEditing && (
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-1 -right-1 h-6 w-6 p-0 rounded-full"
                  onClick={() => document.getElementById('groupImageInput')?.click()}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className={`transition-colors duration-300 ${
                    theme === 'dark' 
                      ? 'bg-slate-700 border-slate-600 text-slate-100' 
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              ) : (
                <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                }`}>{group.name}</h3>
              )}
              
              <p className={`text-sm transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {members.length} member{members.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {isEditing && (
            <div className="space-y-2">
              <label className={`text-sm font-medium transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
              }`}>Group Image URL</label>
              <Input
                id="groupImageInput"
                placeholder="Enter image URL"
                value={groupImage}
                onChange={(e) => setGroupImage(e.target.value)}
                className={`transition-colors duration-300 ${
                  theme === 'dark' 
                    ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400' 
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
                }`}
              />
            </div>
          )}

          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <Button onClick={handleSaveChanges} className="flex-1">
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(true)}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Group
              </Button>
            )}
          </div>
        </div>

        {/* Members List */}
        <div className={`border-t transition-colors duration-300 ${
          theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
        }`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-medium transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
              }`}>Members</h3>
              <Button size="sm" variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>

            <ScrollArea className="h-64">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 animate-pulse">
                      <div className={`w-8 h-8 rounded-full transition-colors duration-300 ${
                        theme === 'dark' ? 'bg-slate-600' : 'bg-gray-300'
                      }`}></div>
                      <div className={`h-4 rounded w-24 transition-colors duration-300 ${
                        theme === 'dark' ? 'bg-slate-600' : 'bg-gray-300'
                      }`}></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className={`flex items-center justify-between p-2 rounded-lg transition-colors duration-200 ${
                        theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.imageUrl} />
                          <AvatarFallback className="bg-purple-500 text-white">
                            {member.name[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className={`text-sm font-medium transition-colors duration-300 ${
                            theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                          }`}>{member.name}</p>
                          <div className="flex items-center space-x-1">
                            {member.role === 'ADMIN' ? (
                              <Crown className="h-3 w-3 text-yellow-500" />
                            ) : (
                              <Shield className="h-3 w-3 text-blue-500" />
                            )}
                            <span className={`text-xs transition-colors duration-300 ${
                              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                            }`}>
                              {member.role}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Actions */}
        <div className={`flex items-center justify-end space-x-3 p-6 border-t transition-colors duration-300 ${
          theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
        }`}>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleLeaveGroup}
            className="min-w-[100px]"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Leave Group
          </Button>
        </div>
      </div>
    </div>
  )
}
