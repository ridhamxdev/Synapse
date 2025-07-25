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
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query.trim()) {
      return NextResponse.json({ users: [] })
    }

    const currentDbUser = await prisma.user.findUnique({
      where: { clerkId: user.id }
    })

    if (!currentDbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 0)
    
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentDbUser.id } },
          {
            OR: [
              { name: { contains: query } },
              { email: { contains: query } },
              { 
                phone: query ? { 
                  contains: query,
                  not: null 
                } : undefined 
              },
              ...queryWords.map(word => ({
                name: { contains: word }
              }))
            ].filter(Boolean)
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
        lastSeen: true,
        createdAt: true
      },
      orderBy: [
        { isOnline: 'desc' },
        { createdAt: 'desc' },
        { name: 'asc' }
      ],
      take: Math.min(limit, 50)
    })

    const scoredUsers = users.map(user => {
      let score = 0
      const lowerQuery = query.toLowerCase()
      const lowerName = user.name.toLowerCase()
      
      if (lowerName === lowerQuery) score += 100
      else if (lowerName.startsWith(lowerQuery)) score += 50
      else if (lowerName.includes(lowerQuery)) score += 25
      
      if (user.email.toLowerCase().includes(lowerQuery)) score += 20
      
      if (user.isOnline) score += 10
      
      return { ...user, relevanceScore: score }
    })
    const sortedUsers = scoredUsers
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .map(({ relevanceScore, ...user }) => user)

    return NextResponse.json({ 
      users: sortedUsers,
      total: sortedUsers.length,
      query: query
    })
  } catch (error) {
    console.error('User search error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}
