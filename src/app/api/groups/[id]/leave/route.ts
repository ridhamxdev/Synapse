import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: groupId } = await params
    const dbUser = await prisma.user.findUnique({ where: { clerkId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Check if user is a member of the group
    const member = await prisma.groupMember.findFirst({ where: { groupId, userId: dbUser.id } })
    if (!member) return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })

    // Check if user is the creator/admin and if they're the only admin
    if (member.role === 'ADMIN') {
      const adminCount = await prisma.groupMember.count({
        where: { groupId, role: 'ADMIN' }
      })
      
      if (adminCount === 1) {
        // If they're the only admin, they can't leave - they need to delete the group or transfer admin
        return NextResponse.json({ 
          error: 'Cannot leave group as the only admin. Delete the group or transfer admin role first.' 
        }, { status: 400 })
      }
    }

    // Remove user from group
    await prisma.groupMember.delete({
      where: { id: member.id }
    })

    return NextResponse.json({ success: true, message: 'Left group successfully' })
  } catch (e) {
    console.error('Leave group error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
