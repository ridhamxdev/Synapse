import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: conversationId, messageId } = await params
    const { status } = await req.json()

    const updateData: any = {}
    if (status === 'delivered') {
      updateData.isDelivered = true
      updateData.deliveredAt = new Date()
    } else if (status === 'read') {
      updateData.isRead = true
      updateData.readAt = new Date()
      updateData.isDelivered = true
      updateData.deliveredAt = updateData.deliveredAt || new Date()
    }

    const message = await prisma.message.update({
      where: { id: messageId },
      data: updateData,
      include: {
        sender: { select: { id: true, clerkId: true,name: true, imageUrl: true } }
      }
    })

    return NextResponse.json({ message })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}
