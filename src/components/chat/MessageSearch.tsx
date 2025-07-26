'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, X } from 'lucide-react'

interface SearchResult {
  id: string
  content: string
  createdAt: string
  sender: {
    name: string
    imageUrl?: string
  }
}

interface MessageSearchProps {
  conversationId: string
  onResultSelect: (messageId: string) => void
  onClose: () => void
}

export function MessageSearch({ conversationId, onResultSelect, onClose }: MessageSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  const searchMessages = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    
    setIsSearching(true)
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/search?q=${encodeURIComponent(query)}`
      )
      if (response.ok) {
        const results = await response.json()
        setSearchResults(results.messages || [])
        setSelectedIndex(-1)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    const timeoutId = setTimeout(() => searchMessages(query), 300)
    return () => clearTimeout(timeoutId)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => 
        prev < searchResults.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      onResultSelect(searchResults[selectedIndex].id)
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-700">
          {part}
        </mark>
      ) : part
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-96 max-h-[60vh] overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                ref={searchInputRef}
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="max-h-96">
          {isSearching ? (
            <div className="p-4 text-center text-gray-500">
              Searching...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="p-2">
              {searchResults.map((result, index) => (
                <div
                  key={result.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-100 dark:bg-blue-900'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => onResultSelect(result.id)}
                >
                  <div className="flex items-start space-x-3">
                    <img
                      src={result.sender.imageUrl || '/default-avatar.png'}
                      alt={result.sender.name}
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {result.sender.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 break-words">
                        {highlightText(result.content, searchQuery)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(result.createdAt).toLocaleDateString()} at{' '}
                        {new Date(result.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery && !isSearching ? (
            <div className="p-4 text-center text-gray-500">
              No messages found
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              Start typing to search messages
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
