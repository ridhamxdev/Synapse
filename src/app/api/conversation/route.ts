import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

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

    // Transform data for frontend
    const transformedConversations = conversations.map(({ conversation, lastReadAt }) => {
      const otherUser = conversation.users[0]?.user
      const lastMessage = conversation.messages[0]
      
      // Count unread messages
      const unreadCount = conversation.messages.filter(msg => 
        msg.senderId !== currentDbUser.id && 
        !msg.readBy.some(read => read.userId === currentDbUser.id)
      ).length

      return {
        id: conversation.id,
        type: conversation.type,
        name: conversation.type === 'DIRECT' ? otherUser?.name : conversation.name,
        imageUrl: conversation.type === 'DIRECT' ? otherUser?.imageUrl : conversation.imageUrl,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          timestamp: lastMessage.createdAt,
          senderId: lastMessage.senderId,
          senderName: lastMessage.sender.name
        } : null,
        unreadCount,
        isOnline: conversation.type === 'DIRECT' ? otherUser?.isOnline : false,
        lastSeen: conversation.type === 'DIRECT' ? otherUser?.lastSeen : null,
        updatedAt: conversation.updatedAt
      }
    })

    return NextResponse.json({ conversations: transformedConversations })
  } catch (error) {
    console.error('Conversations fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create new conversation
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { participantId, type = 'DIRECT' } = await req.json()

    const currentDbUser = await prisma.user.findUnique({
      where: { clerkId: user.id }
    })

    if (!currentDbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        users: {
          every: {
            userId: { in: [currentDbUser.id, participantId] }
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

    if (existingConversation) {
      return NextResponse.json({ conversation: existingConversation })
    }

    // Create new conversation
    const newConversation = await prisma.conversation.create({
      data: {
        type,
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

    return NextResponse.json({ conversation: newConversation })
  } catch (error) {
    console.error('Conversation creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
