import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: groupId } = await params
    const dbUser = await prisma.user.findUnique({ where: { clerkId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const member = await prisma.groupMember.findFirst({ where: { groupId, userId: dbUser.id } })
    if (!member) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: { select: { id: true, name: true, imageUrl: true } }
      },
      orderBy: { joinedAt: 'asc' }
    })

    const formattedMembers = members.map(m => ({
      id: m.user.id,
      name: m.user.name,
      imageUrl: m.user.imageUrl,
      role: m.role,
      joinedAt: m.joinedAt
    }))

    return NextResponse.json({ members: formattedMembers })
  } catch (e) {
    console.error('Group members fetch error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
