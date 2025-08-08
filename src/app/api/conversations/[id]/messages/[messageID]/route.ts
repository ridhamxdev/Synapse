import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; messageID: string }> }
) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: conversationId, messageID } = await params
    const { emoji } = await req.json()
    if (!emoji) return NextResponse.json({ error: 'Emoji required' }, { status: 400 })

    const currentDbUser = await prisma.user.findUnique({ where: { clerkId: user.id } })
    if (!currentDbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const access = await prisma.conversationUser.findFirst({ where: { conversationId, userId: currentDbUser.id } })
    if (!access) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

    const existing = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId: messageID,
          userId: currentDbUser.id,
          emoji,
        },
      },
    })

    if (existing) {
      await prisma.messageReaction.delete({ where: { id: existing.id } })
    } else {
      await prisma.messageReaction.create({ data: { messageId: messageID, userId: currentDbUser.id, emoji } })
    }

    const reactions = await prisma.messageReaction.findMany({
      where: { messageId: messageID },
      select: { id: true, emoji: true, userId: true },
    })

    return NextResponse.json({ reactions })
  } catch (error) {
    console.error('Reaction toggle error:', error)
    return NextResponse.json({ error: 'Failed to toggle reaction' }, { status: 500 })
  }
}


