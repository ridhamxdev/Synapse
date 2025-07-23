import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || ''

    // Get current user's database record
    const currentDbUser = await prisma.user.findUnique({
      where: { clerkId: user.id }
    })

    if (!currentDbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Search for users (excluding current user) - MySQL compatible
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentDbUser.id } },
          {
            OR: [
              { 
                name: { 
                  contains: query,
                  // Remove mode: 'insensitive' for MySQL compatibility
                } 
              },
              { 
                email: { 
                  contains: query,
                  // Remove mode: 'insensitive' for MySQL compatibility
                } 
              },
              // Handle nullable phone field properly
              ...(query ? [{ 
                phone: { 
                  contains: query,
                  not: null // Ensure phone is not null
                } 
              }] : [])
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        imageUrl: true,
        bio: true,
        isOnline: true,
        lastSeen: true
      },
      take: 20,
      orderBy: [
        { isOnline: 'desc' }, // Online users first
        { name: 'asc' }       // Then alphabetically
      ]
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('User search error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}
