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
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

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

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            imageUrl: true
          }
        },
        replyTo: {
          include: {
            sender: {
              select: { name: true }
            }
          }
        },
        reactions: {
          select: {
            id: true,
            emoji: true,
            userId: true
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      skip: offset,
      take: limit
    })

    if (messages.length > 0) {
      await prisma.messageRead.upsert({
        where: {
          messageId_userId: {
            messageId: messages[messages.length - 1].id,
            userId: currentDbUser.id
          }
        },
        update: { readAt: new Date() },
        create: {
          messageId: messages[messages.length - 1].id,
          userId: currentDbUser.id,
          readAt: new Date()
        }
      })
    }

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total: messages.length
      }
    })

  } catch (error) {
    console.error('Messages fetch error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: conversationId } = await params
    const body = await req.json()
    const { content, type = 'TEXT', fileUrl, fileName, fileSize, replyToId } = body

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

    const message = await prisma.message.create({
      data: {
        content: content || '',
        type,
        conversationId,
        senderId: currentDbUser.id,
        fileUrl,
        fileName,
        fileSize: fileSize ? parseInt(fileSize) : null,
        replyToId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            imageUrl: true
          }
        },
        replyTo: {
          include: {
            sender: {
              select: { name: true }
            }
          }
        },
        reactions: {
          select: {
            id: true,
            emoji: true,
            userId: true
          }
        }
      }
    })
    
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json({
      message,
      success: true
    })

  } catch (error) {
    console.error('Message creation error:', error)
    return NextResponse.json({
      error: 'Failed to send message',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}
