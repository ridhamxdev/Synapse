'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Conversation } from '@prisma/client'

interface ConversationListProps {
  searchQuery: string
  selectedConversation: string | null
  onSelectConversation: (conversationId: string) => void
}

export function ConversationList({
  searchQuery,
  selectedConversation,
  onSelectConversation,
}: ConversationListProps) {
  const { user } = useUser()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      } else {
        const errorData = await response.json()
        console.error('❌ Failed to load conversations:', errorData)
      }
    } catch (error) {
      console.error('🔴 Conversations fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading conversations...</div>;
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredConversations.length === 0) {
    return <div className="p-4 text-center text-gray-400">No conversations found.</div>;
  }

  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
      {filteredConversations.map((conv) => (
        <li
          key={conv.id}
          className={`p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedConversation === conv.id ? 'bg-gray-100 dark:bg-gray-700 font-semibold' : ''}`}
          onClick={() => onSelectConversation(conv.id)}
        >
          {conv.name || 'Untitled Conversation'}
        </li>
      ))}
    </ul>
  );
}
