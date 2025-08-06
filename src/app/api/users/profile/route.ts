import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, bio, phone, imageUrl } = body

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { clerkId: user.id },
      data: {
        name: name || user.fullName || `${user.firstName} ${user.lastName}`,
        bio: bio || "Hey there! I'm using WhatsApp Clone.",
        phone: phone || null,
        imageUrl: imageUrl || user.imageUrl,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ 
      success: true, 
      user: updatedUser 
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    let dbUser

    if (userId) {
      // If userId is provided, try to find by database ID first, then by clerkId
      dbUser = await prisma.user.findUnique({
        where: { id: userId }
      })

      // If not found by ID, try by clerkId
      if (!dbUser) {
        dbUser = await prisma.user.findUnique({
          where: { clerkId: userId }
        })
      }
    } else {
      // If no userId provided, fetch current user's profile
      dbUser = await prisma.user.findUnique({
        where: { clerkId: user.id }
      })
    }

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user: dbUser })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
} 