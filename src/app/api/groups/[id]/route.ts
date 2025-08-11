import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: groupId } = await params
    const { name, imageUrl } = await req.json()
    
    const dbUser = await prisma.user.findUnique({ where: { clerkId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Check if user is admin of the group
    const member = await prisma.groupMember.findFirst({ 
      where: { groupId, userId: dbUser.id, role: 'ADMIN' } 
    })
    if (!member) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: {
        name: name?.trim(),
        imageUrl: imageUrl?.trim() || null,
        updatedAt: new Date()
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, imageUrl: true } } } }
      }
    })

    return NextResponse.json({
      group: {
        id: updatedGroup.id,
        type: 'GROUP',
        name: updatedGroup.name,
        imageUrl: updatedGroup.imageUrl,
        lastMessage: null,
        unreadCount: 0,
        isOnline: false,
        participants: updatedGroup.members.map((m) => ({ 
          id: m.user.id, 
          name: m.user.name, 
          imageUrl: m.user.imageUrl 
        }))
      }
    })
  } catch (e) {
    console.error('Group update error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
