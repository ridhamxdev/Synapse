'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Drawer,
  DrawerContent,
  DrawerTitle,
} from '@/components/ui/drawer'
import { 
  User, 
  Mail, 
  Phone, 
  Info, 
  Calendar, 
  Hash, 
  MessageCircle,
  Video,
  Phone as PhoneIcon,
} from 'lucide-react'

interface UserProfileDrawerProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName?: string
  userEmail?: string
  userImageUrl?: string
  userBio?: string
  userPhone?: string
  userCreatedAt?: string
  onStartChat?: () => void
  onStartCall?: () => void
  onStartVideoCall?: () => void
}

interface UserData {
  name: string
  bio: string
  phone: string
  email: string
  imageUrl: string
  createdAt?: string
}

export function UserProfileDrawer({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
  userImageUrl,
  userBio,
  userPhone,
  userCreatedAt,
  onStartChat,
  onStartCall,
  onStartVideoCall
}: UserProfileDrawerProps) {
  const { theme } = useTheme()
  
  const isDarkMode = theme === 'dark'
  const [userData, setUserData] = useState<UserData>({
    name: userName || 'Unknown User',
    bio: userBio || 'No bio available',
    phone: userPhone || '',
    email: userEmail || '',
    imageUrl: userImageUrl || '',
    createdAt: userCreatedAt
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      const loadUserProfile = async () => {
        setIsLoading(true)
        try {
          const response = await fetch(`/api/users/profile?userId=${userId}`)
          if (response.ok) {
            const data = await response.json()
            if (data.user) {
              setUserData({
                name: data.user.name || userName || 'Unknown User',
                bio: data.user.bio || userBio || 'No bio available',
                phone: data.user.phone || userPhone || '',
                email: data.user.email || userEmail || '',
                imageUrl: data.user.imageUrl || userImageUrl || '',
                createdAt: data.user.createdAt || userCreatedAt
              })
            }
          } else {
            console.warn('Profile API returned:', response.status, response.statusText)
          }
        } catch (error) {
          console.error('Failed to load user profile:', error)
        } finally {
          setIsLoading(false)
        }
      }

      loadUserProfile()
    }
  }, [isOpen, userId, userName, userEmail, userImageUrl, userBio, userPhone, userCreatedAt])

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
             <DrawerContent className={`max-w-md h-[85vh] transition-all duration-500 ${
         isDarkMode 
           ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700 shadow-2xl' 
           : 'bg-gradient-to-br from-gray-50 via-white to-gray-50 border-gray-200 shadow-xl'
       }`}>
         <DrawerTitle className="sr-only">Profile</DrawerTitle>
         <div className={`px-6 pb-6 flex flex-col flex-1 overflow-hidden`}>
           <div className={`transition-all duration-300 pb-4 flex-shrink-0 ${
             isDarkMode 
               ? 'border-slate-700 bg-gradient-to-r from-slate-800/50 to-slate-700/50' 
               : 'border-gray-200 bg-gradient-to-r from-gray-100/50 to-white/50'
           }`}>
             <h2 className={`text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent transition-all duration-300 ${
               isDarkMode ? 'drop-shadow-lg' : ''
             }`}>
               Profile
             </h2>
             <p className={`text-sm transition-colors duration-300 ${
               isDarkMode ? 'text-slate-400' : 'text-gray-600'
             }`}>
               View user profile and contact information
             </p>
           </div>
          
          <div 
            className="flex-1 flex flex-col"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <ScrollArea className="flex-1 w-full" type="always">
                <div className="space-y-3 pr-4 pb-8">
                  {/* Avatar Section */}
                  <div className="flex flex-col items-center space-y-3">
                    <div className="relative group">
                      <div className={`absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-pulse`}></div>
                      <Avatar 
                        className={`h-28 w-28 transition-all duration-500 shadow-2xl border-4 relative z-10 ${
                          isDarkMode 
                            ? 'border-slate-700 shadow-slate-900/50' 
                            : 'border-white shadow-gray-200/50'
                        } hover:scale-105 hover:shadow-3xl`}
                      >
                        <AvatarImage src={userData.imageUrl} className="object-cover" />
                        <AvatarFallback className={`text-3xl font-bold ${
                          isDarkMode 
                            ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white' 
                            : 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white'
                        }`}>
                          {userData.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <div className="text-center space-y-2">
                      <h3 className={`text-2xl font-bold transition-all duration-300 ${
                        isDarkMode 
                          ? 'text-white drop-shadow-lg' 
                          : 'text-gray-800'
                      }`}>
                        {userData.name}
                      </h3>
                      <p className={`text-sm leading-relaxed transition-colors duration-300 max-w-xs ${
                        isDarkMode 
                          ? 'text-slate-300' 
                          : 'text-gray-600'
                      }`}>
                        {userData.bio}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className={`flex space-x-2 p-3 rounded-2xl backdrop-blur-sm ${
                    isDarkMode 
                      ? 'bg-slate-800/30 border border-slate-700/50' 
                      : 'bg-white/50 border border-gray-200/50'
                  }`}>
                    <Button
                      onClick={onStartChat}
                      className={`flex-1 shadow-lg hover:shadow-xl transition-all duration-300 ${
                        isDarkMode 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700' 
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                      }`}
                    >
                      <MessageCircle className="w-3 h-3 mr-2" />
                      Message
                    </Button>
                    <Button
                      onClick={onStartCall}
                      variant="outline"
                      className={`flex-1 shadow-lg hover:shadow-xl transition-all duration-300 ${
                        isDarkMode 
                          ? 'border-slate-600 text-slate-200 hover:bg-slate-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <PhoneIcon className="w-3 h-3 mr-2" />
                      Call
                    </Button>
                    <Button
                      onClick={onStartVideoCall}
                      variant="outline"
                      className={`flex-1 shadow-lg hover:shadow-xl transition-all duration-300 ${
                        isDarkMode 
                          ? 'border-slate-600 text-slate-200 hover:bg-slate-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Video className="w-3 h-3 mr-2" />
                      Video
                    </Button>
                  </div>

                  {/* Profile Information */}
                  <div className="space-y-2">
                    {/* Name Section */}
                    <div className={`space-y-2 p-2 rounded-2xl transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50' 
                        : 'bg-white/50 border border-gray-200/50 hover:bg-white/70'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl shadow-lg ${
                          isDarkMode 
                            ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/20' 
                            : 'bg-gradient-to-br from-blue-500/10 to-blue-600/10'
                        }`}>
                          <User className={`w-5 h-5 ${
                            isDarkMode ? 'text-blue-400' : 'text-blue-600'
                          }`} />
                        </div>
                        <span className={`text-sm font-bold uppercase tracking-wider transition-colors duration-300 ${
                          isDarkMode ? 'text-slate-300' : 'text-gray-600'
                        }`}>
                          Display Name
                        </span>
                      </div>
                      <p className={`text-lg font-semibold transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>
                        {userData.name}
                      </p>
                    </div>

                    {/* Email Section */}
                    {userData.email && (
                      <div className={`space-y-2 p-2 rounded-2xl transition-all duration-300 ${
                        isDarkMode 
                          ? 'bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50' 
                          : 'bg-white/50 border border-gray-200/50 hover:bg-white/70'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-xl shadow-lg ${
                            isDarkMode 
                              ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20' 
                              : 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/10'
                          }`}>
                            <Mail className={`w-5 h-5 ${
                              isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                            }`} />
                          </div>
                          <span className={`text-sm font-bold uppercase tracking-wider transition-colors duration-300 ${
                            isDarkMode ? 'text-slate-300' : 'text-gray-600'
                          }`}>
                            Email Address
                          </span>
                        </div>
                        <p className={`text-lg font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-800'
                        }`}>
                          {userData.email}
                        </p>
                      </div>
                    )}

                    {/* Phone Section */}
                    {userData.phone && (
                      <div className={`space-y-2 p-2 rounded-2xl transition-all duration-300 ${
                        isDarkMode 
                          ? 'bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50' 
                          : 'bg-white/50 border border-gray-200/50 hover:bg-white/70'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-xl shadow-lg ${
                            isDarkMode 
                              ? 'bg-gradient-to-br from-orange-500/20 to-orange-600/20' 
                              : 'bg-gradient-to-br from-orange-500/10 to-orange-600/10'
                          }`}>
                            <Phone className={`w-5 h-5 ${
                              isDarkMode ? 'text-orange-400' : 'text-orange-600'
                            }`} />
                          </div>
                          <span className={`text-sm font-bold uppercase tracking-wider transition-colors duration-300 ${
                            isDarkMode ? 'text-slate-300' : 'text-gray-600'
                          }`}>
                            Phone Number
                          </span>
                        </div>
                        <p className={`text-lg font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-800'
                        }`}>
                          {userData.phone}
                        </p>
                      </div>
                    )}

                    {/* Bio Section */}
                    {userData.bio && userData.bio !== 'No bio available' && (
                      <div className={`space-y-2 p-2 rounded-2xl transition-all duration-300 ${
                        isDarkMode 
                          ? 'bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50' 
                          : 'bg-white/50 border border-gray-200/50 hover:bg-white/70'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-xl shadow-lg ${
                            isDarkMode 
                              ? 'bg-gradient-to-br from-purple-500/20 to-purple-600/20' 
                              : 'bg-gradient-to-br from-purple-500/10 to-purple-600/10'
                          }`}>
                            <Info className={`w-5 h-5 ${
                              isDarkMode ? 'text-purple-400' : 'text-purple-600'
                            }`} />
                          </div>
                          <span className={`text-sm font-bold uppercase tracking-wider transition-colors duration-300 ${
                            isDarkMode ? 'text-slate-300' : 'text-gray-600'
                          }`}>
                            About
                          </span>
                        </div>
                        <p className={`text-base leading-relaxed transition-colors duration-300 ${
                          isDarkMode ? 'text-slate-200' : 'text-gray-700'
                        }`}>
                          {userData.bio}
                        </p>
                      </div>
                    )}

                    {/* Account Information Section */}
                    <div className={`space-y-3 p-2 rounded-2xl transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50' 
                        : 'bg-white/50 border border-gray-200/50 hover:bg-white/70'
                    }`}>
                      <h4 className={`text-lg font-bold flex items-center gap-3 transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>
                        <div className={`p-3 rounded-xl shadow-lg ${
                          isDarkMode 
                            ? 'bg-gradient-to-br from-slate-600/20 to-slate-700/20' 
                            : 'bg-gradient-to-br from-gray-500/10 to-gray-600/10'
                        }`}>
                          <Hash className={`w-5 h-5 ${
                            isDarkMode ? 'text-slate-400' : 'text-gray-600'
                          }`} />
                        </div>
                        Account Information
                      </h4>
                      
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <span className={`text-sm font-bold uppercase tracking-wider transition-colors duration-300 ${
                            isDarkMode ? 'text-slate-300' : 'text-gray-600'
                          }`}>
                            User ID
                          </span>
                          <div className={`p-3 rounded-xl backdrop-blur-sm transition-all duration-300 ${
                            isDarkMode 
                              ? 'bg-slate-800/50 border border-slate-700/50' 
                              : 'bg-gray-100/50 border border-gray-200/50'
                          }`}>
                            <p className={`text-sm font-mono transition-colors duration-300 ${
                              isDarkMode ? 'text-slate-300' : 'text-gray-700'
                            }`}>
                              {userId}
                            </p>
                          </div>
                        </div>

                        {userData.createdAt && (
                          <div className="space-y-3">
                            <span className={`text-sm font-bold uppercase tracking-wider transition-colors duration-300 ${
                              isDarkMode ? 'text-slate-300' : 'text-gray-600'
                            }`}>
                              Member Since
                            </span>
                            <div className={`flex items-center gap-3 p-3 rounded-xl backdrop-blur-sm transition-all duration-300 ${
                              isDarkMode 
                                ? 'bg-slate-800/50 border border-slate-700/50' 
                                : 'bg-gray-100/50 border border-gray-200/50'
                            }`}>
                              <div className={`p-2 rounded-lg ${
                                isDarkMode 
                                  ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/20' 
                                  : 'bg-gradient-to-br from-blue-500/10 to-blue-600/10'
                              }`}>
                                <Calendar className={`w-4 h-4 ${
                                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                }`} />
                              </div>
                              <p className={`text-sm font-medium transition-colors duration-300 ${
                                isDarkMode ? 'text-slate-200' : 'text-gray-700'
                              }`}>
                                {new Date(userData.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
} 