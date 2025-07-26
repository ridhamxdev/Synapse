import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { MessageType } from '@prisma/client'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: conversationId } = await params
    const formData = await req.formData()
    
    const audioFile = formData.get('audio') as File
    const duration = formData.get('duration') as string
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    const currentDbUser = await prisma.user.findUnique({
      where: { clerkId: user.id }
    })

    if (!currentDbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Save audio file
    const bytes = await audioFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const filename = `voice_${Date.now()}.webm`
    const filepath = join(process.cwd(), 'public', 'uploads', 'voice', filename)
    
    await writeFile(filepath, buffer)

    const message = await prisma.message.create({
      data: {
        content: `Voice message (${duration}s)`,
        type: 'VOICE' as MessageType,
        conversationId,
        senderId: currentDbUser.id,
        fileUrl: `/uploads/voice/${filename}`,
        fileName: filename,
        fileSize: audioFile.size,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            imageUrl: true
          }
        }
      }
    })

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json({ message, success: true })
  } catch (error) {
    console.error('Voice message error:', error)
    return NextResponse.json({ error: 'Failed to save voice message' }, { status: 500 })
  }
}
    