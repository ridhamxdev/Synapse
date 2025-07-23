import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: user.id }
    })

    if (existingUser) {
      // Update existing user info
      const updatedUser = await prisma.user.update({
        where: { clerkId: user.id },
        data: {
          name: user.fullName || `${user.firstName} ${user.lastName}`,
          email: user.emailAddresses[0]?.emailAddress || '',
          imageUrl: user.imageUrl,
          phone: user.phoneNumbers[0]?.phoneNumber || null,
          isOnline: true,
          lastSeen: new Date()
        }
      })
      return NextResponse.json({ user: updatedUser })
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        clerkId: user.id,
        name: user.fullName || `${user.firstName} ${user.lastName}`,
        email: user.emailAddresses[0]?.emailAddress || '',
        imageUrl: user.imageUrl,
        phone: user.phoneNumbers[0]?.phoneNumber || null,
        bio: "Hey there! I'm using WhatsApp Clone.",
        isOnline: true,
        lastSeen: new Date()
      }
    })

    return NextResponse.json({ user: newUser })
  } catch (error) {
    console.error('User sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
