import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// Create new conversation
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { participantId } = await req.json()

    if (!participantId) {
      return NextResponse.json({ error: 'Participant ID required' }, { status: 400 })
    }

    // Get current user from database
    const currentDbUser = await prisma.user.findUnique({
      where: { clerkId: user.id }
    })

    if (!currentDbUser) {
      return NextResponse.json({ error: 'Current user not found' }, { status: 404 })
    }

    // Verify participant exists
    const participant = await prisma.user.findUnique({
      where: { id: participantId }
    })

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    // Check if conversation already exists between these users
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          {
            users: {
              some: { userId: currentDbUser.id }
            }
          },
          {
            users: {
              some: { userId: participantId }
            }
          }
        ]
      },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                isOnline: true
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { name: true }
            }
          }
        }
      }
    })

    if (existingConversation) {
      console.log('📞 Returning existing conversation:', existingConversation.id)
      return NextResponse.json({ 
        conversation: existingConversation,
        isNew: false
      })
    }

    // Create new conversation
    const newConversation = await prisma.conversation.create({
      data: {
        type: 'DIRECT',
        users: {
          createMany: {
            data: [
              { userId: currentDbUser.id },
              { userId: participantId }
            ]
          }
        }
      },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                isOnline: true
              }
            }
          }
        }
      }
    })

    console.log('✅ Created new conversation:', newConversation.id)

    return NextResponse.json({ 
      conversation: newConversation,
      isNew: true
    })

  } catch (error) {
    console.error('❌ Conversation creation error:', error)
    return NextResponse.json({ 
      error: 'Failed to create conversation', 
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}

// Get user's conversations
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentDbUser = await prisma.user.findUnique({
      where: { clerkId: user.id }
    })

    if (!currentDbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const conversations = await prisma.conversationUser.findMany({
      where: { userId: currentDbUser.id },
      include: {
        conversation: {
          include: {
            users: {
              where: { userId: { not: currentDbUser.id } },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                    isOnline: true,
                    lastSeen: true
                  }
                }
              }
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: {
                  select: {
                    id: true,
                    name: true
                  }
                },
                readBy: {
                  where: { userId: currentDbUser.id }
                }
              }
            }
          }
        }
      },
      orderBy: {
        conversation: {
          updatedAt: 'desc'
        }
      }
    })

    // Transform data for frontend with proper null checks
    const transformedConversations = conversations.map(({ conversation, lastReadAt }) => {
      const otherUser = conversation.users[0]?.user
      const lastMessage = conversation.messages[0]
      
      // Count unread messages (messages sent after lastReadAt)
      const unreadCount = conversation.messages.filter(msg => 
        msg.senderId !== currentDbUser.id && 
        (!lastReadAt || msg.createdAt > lastReadAt) &&
        !msg.readBy.some(read => read.userId === currentDbUser.id)
      ).length

      return {
        id: conversation.id,
        type: conversation.type,
        name: safeString(otherUser?.name) || 'Unknown User', // Safe string handling
        imageUrl: safeString(otherUser?.imageUrl) || null,
        lastMessage: lastMessage ? {
          content: safeString(lastMessage.content) || '',
          timestamp: lastMessage.createdAt,
          senderId: lastMessage.senderId,
          senderName: safeString(lastMessage.sender?.name) || 'Unknown'
        } : null,
        unreadCount,
        isOnline: otherUser?.isOnline || false,
        lastSeen: otherUser?.lastSeen || null,
        updatedAt: conversation.updatedAt
      }
    })

    return NextResponse.json({ conversations: transformedConversations })
  } catch (error) {
    console.error('❌ Conversations fetch error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}

// Helper function to safely handle strings
function safeString(value: any): string | null {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === 'string') {
    return value
  }
  // Convert to string if it's another type
  return String(value)
}
