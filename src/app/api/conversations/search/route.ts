import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ conversations: [] })
    }

    const currentDbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true }
    })

    if (!currentDbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const searchTerm = query.trim()
    
    const userConversations = await prisma.conversationUser.findMany({
      where: { userId: currentDbUser.id },
      include: {
        conversation: {
          include: {
            users: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    clerkId: true,
                    imageUrl: true
                  }
                }
              }
            },
            messages: {
              where: {
                isDeleted: false,
                OR: [
                  {
                    content: {
                      contains: searchTerm
                    }
                  },
                  {
                    fileName: {
                      contains: searchTerm
                    }
                  }
                ]
              },
              include: {
                sender: {
                  select: {
                    id: true,
                    name: true,
                    clerkId: true,
                    imageUrl: true
                  }
                }
              },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    })

    const conversationsWithMatches = userConversations
      .filter(uc => uc.conversation.messages.length > 0)
      .map(uc => {
        const conversation = uc.conversation
        const matchingMessage = conversation.messages[0]
        
        return {
          id: conversation.id,
          name: conversation.name || 'Untitled Conversation',
          imageUrl: conversation.imageUrl,
          lastMessage: {
            content: matchingMessage.content,
            timestamp: matchingMessage.createdAt.toISOString(),
            senderId: matchingMessage.sender.clerkId,
            senderName: matchingMessage.sender.name,
            senderImageUrl: matchingMessage.sender.imageUrl,
            messageId: matchingMessage.id
          },
          unreadCount: 0,
          isOnline: false,
          participants: conversation.users.map((cu: any) => ({
            id: cu.user.clerkId,
            name: cu.user.name,
            imageUrl: cu.user.imageUrl
          })),
          matchCount: conversation.messages.length
        }
      })
      .sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime())

    return NextResponse.json({ 
      conversations: conversationsWithMatches,
      total: conversationsWithMatches.length,
      query: searchTerm
    })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ 
      error: 'Search failed',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
} 