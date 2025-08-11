import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: groupId } = await params
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    const dbUser = await prisma.user.findUnique({ where: { clerkId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const member = await prisma.groupMember.findFirst({ where: { groupId, userId: dbUser.id } })
    if (!member) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

    const messages = await prisma.message.findMany({
      where: { groupId },
      include: {
        sender: { select: { id: true, name: true, imageUrl: true } },
        replyTo: { include: { sender: { select: { name: true } } } },
        reactions: { select: { id: true, emoji: true, userId: true } },
      },
      orderBy: { createdAt: 'asc' },
      skip: offset,
      take: limit,
    })

    return NextResponse.json({ messages, pagination: { page, limit, total: messages.length } })
  } catch (e) {
    console.error('Group messages fetch error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: groupId } = await params
    const body = await req.json()
    const { content, type = 'TEXT', fileUrl, fileName, fileSize, replyToId } = body

    const dbUser = await prisma.user.findUnique({ where: { clerkId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const member = await prisma.groupMember.findFirst({ where: { groupId, userId: dbUser.id } })
    if (!member) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

    const message = await prisma.message.create({
      data: {
        content: content || '',
        type,
        groupId,
        senderId: dbUser.id,
        fileUrl,
        fileName,
        fileSize: fileSize ? parseInt(fileSize) : null,
        replyToId,
      },
      include: {
        sender: { select: { id: true, name: true, imageUrl: true } },
        replyTo: { include: { sender: { select: { name: true } } } },
        reactions: { select: { id: true, emoji: true, userId: true } },
      },
    })

    await prisma.group.update({ where: { id: groupId }, data: { updatedAt: new Date() } })

    return NextResponse.json({ message, success: true })
  } catch (e) {
    console.error('Group message create error:', e)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}


