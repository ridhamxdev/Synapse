import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { clerkId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const groupMembers = await prisma.groupMember.findMany({
      where: { userId: dbUser.id },
      include: {
        group: {
          include: {
            members: { include: { user: { select: { id: true, name: true, imageUrl: true } } } },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { sender: { select: { id: true, name: true } } },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    })

    const groups = groupMembers.map((gm) => {
      const g = gm.group
      const last = g.messages[0]
      return {
        id: g.id,
        type: 'GROUP' as const,
        name: g.name,
        imageUrl: g.imageUrl,
        lastMessage: last
          ? {
              content: last.content,
              timestamp: last.createdAt,
              senderId: last.senderId,
              senderName: last.sender?.name || 'Unknown',
            }
          : null,
        unreadCount: 0,
        isOnline: false,
        participants: g.members.map((m) => ({ id: m.user.id, name: m.user.name, imageUrl: m.user.imageUrl })),
      }
    })

    return NextResponse.json({ groups })
  } catch (e) {
    console.error('Groups list error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { clerkId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { name, imageUrl, memberIds } = await req.json()
    if (!name || typeof name !== 'string') return NextResponse.json({ error: 'Group name required' }, { status: 400 })

    const uniqueMemberIds: string[] = Array.isArray(memberIds) ? Array.from(new Set(memberIds)) : []
    if (!uniqueMemberIds.includes(dbUser.id)) uniqueMemberIds.push(dbUser.id)

    const group = await prisma.group.create({
      data: {
        name,
        imageUrl,
        creatorId: dbUser.id,
        members: {
          create: uniqueMemberIds.map((uid) => ({ userId: uid, role: uid === dbUser.id ? 'ADMIN' : 'MEMBER' })),
        },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, imageUrl: true } } } },
      },
    })

    return NextResponse.json({
      group: {
        id: group.id,
        type: 'GROUP',
        name: group.name,
        imageUrl: group.imageUrl,
        lastMessage: null,
        unreadCount: 0,
        isOnline: false,
        participants: group.members.map((m) => ({ id: m.user.id, name: m.user.name, imageUrl: m.user.imageUrl })),
      },
    })
  } catch (e) {
    console.error('Group create error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


