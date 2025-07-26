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
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ messages: [] })
    }

    const currentDbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true }
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

    const searchTerm = query.trim()
    
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        isDeleted: false,
        OR: [
          {
            content: {
              contains: searchTerm,
            }
          },
          {
            fileName: {
              contains: searchTerm,
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
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                id: true,
                name: true,
                clerkId: true,
                imageUrl: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    const formattedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      type: message.type,
      createdAt: message.createdAt,
      sender: message.sender,
      replyTo: message.replyTo,
      fileUrl: message.fileUrl,
      fileName: message.fileName
    }))

    return NextResponse.json({ 
      messages: formattedMessages,
      total: formattedMessages.length,
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
