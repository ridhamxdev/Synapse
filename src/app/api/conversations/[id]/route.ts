import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: conversationId } = await params

    const currentDbUser = await prisma.user.findUnique({
      where: { clerkId: user.id }
    })

    if (!currentDbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const conversationAccess = await prisma.conversationUser.findFirst({
      where: {
        conversationId,
        userId: currentDbUser.id
      }
    })

    if (!conversationAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        users: {
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
              select: { name: true }
            }
          }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const otherUser = conversation.users.find(u => u.userId !== currentDbUser.id)?.user
    const lastMessage = conversation.messages[0]
    
    const transformedConversation = {
      id: conversation.id,
      type: conversation.type,
      name: otherUser?.name || 'Unknown User',
      imageUrl: otherUser?.imageUrl || null,
      lastMessage: lastMessage ? {
        content: lastMessage.content,
        timestamp: lastMessage.createdAt,
        senderId: lastMessage.senderId,
        senderName: lastMessage.sender?.name || 'Unknown'
      } : null,
      unreadCount: 0,
      isOnline: otherUser?.isOnline || false,
      lastSeen: otherUser?.lastSeen || null,
      participants: conversation.users.map(u => ({
        id: u.user.id,
        name: u.user.name,
        imageUrl: u.user.imageUrl
      }))
    }

    return NextResponse.json({ conversation: transformedConversation })

  } catch (error) {
    console.error('❌ Conversation fetch error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
} 