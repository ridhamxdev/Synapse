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

    // Get current user's database record
    const currentDbUser = await prisma.user.findUnique({
      where: { clerkId: user.id }
    })

    if (!currentDbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Split query into words for better matching
    const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 0)
    
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentDbUser.id } },
          {
            OR: [
              // Exact name match
              { name: { contains: query } },
              // Email match
              { email: { contains: query } },
              // Phone match (if not null)
              { 
                phone: query ? { 
                  contains: query,
                  not: null 
                } : undefined 
              },
              // Multi-word name search
              ...queryWords.map(word => ({
                name: { contains: word }
              }))
            ].filter(Boolean) // Remove undefined entries
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
        { isOnline: 'desc' },     // Online users first
        { createdAt: 'desc' },    // Newer users next
        { name: 'asc' }           // Then alphabetically
      ],
      take: Math.min(limit, 50) // Max 50 results
    })

    // Add relevance scoring (optional)
    const scoredUsers = users.map(user => {
      let score = 0
      const lowerQuery = query.toLowerCase()
      const lowerName = user.name.toLowerCase()
      
      // Exact name match gets highest score
      if (lowerName === lowerQuery) score += 100
      // Name starts with query gets high score
      else if (lowerName.startsWith(lowerQuery)) score += 50
      // Name contains query gets medium score
      else if (lowerName.includes(lowerQuery)) score += 25
      
      // Email match gets points
      if (user.email.toLowerCase().includes(lowerQuery)) score += 20
      
      // Online users get bonus points
      if (user.isOnline) score += 10
      
      return { ...user, relevanceScore: score }
    })

    // Sort by relevance score
    const sortedUsers = scoredUsers
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .map(({ relevanceScore, ...user }) => user) // Remove score from response

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
