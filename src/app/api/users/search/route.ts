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

    // Get current user's database record
    const currentDbUser = await prisma.user.findUnique({
      where: { clerkId: user.id }
    })

    if (!currentDbUser) {
      return NextResponse.json({ 
        error: 'User not found in database. Please refresh and try again.',
        debug: { clerkId: user.id }
      }, { status: 404 })
    }

    // If no search query, return recent/online users
    if (!query.trim()) {
      const recentUsers = await prisma.user.findMany({
        where: { id: { not: currentDbUser.id } },
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
          { lastSeen: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 10 // Show 10 recent users when no search query
      })

      return NextResponse.json({ 
        users: recentUsers,
        total: recentUsers.length,
        query: '',
        type: 'recent'
      })
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
              ...(query ? [{
                phone: { 
                  contains: query,
                  not: null 
                }
              }] : []),
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

    // Add relevance scoring
    const scoredUsers = users.map(foundUser => {
      let score = 0
      const lowerQuery = query.toLowerCase()
      const lowerName = foundUser.name.toLowerCase()
      const lowerEmail = foundUser.email.toLowerCase()
      
      // Exact name match gets highest score
      if (lowerName === lowerQuery) score += 100
      // Name starts with query gets high score
      else if (lowerName.startsWith(lowerQuery)) score += 50
      // Name contains query gets medium score
      else if (lowerName.includes(lowerQuery)) score += 25
      
      // Email match gets points
      if (lowerEmail.includes(lowerQuery)) score += 20
      
      // Phone match gets points
      if (foundUser.phone && foundUser.phone.includes(query)) score += 15
      
      // Online users get bonus points
      if (foundUser.isOnline) score += 10
      
      // Recent users get small bonus
      const daysSinceCreated = Math.floor((Date.now() - new Date(foundUser.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      if (daysSinceCreated < 7) score += 5
      
      return { ...foundUser, relevanceScore: score }
    })

    // Sort by relevance score
    const sortedUsers = scoredUsers
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .map(({ relevanceScore, ...user }) => user) // Remove score from response

    console.log(`🔍 Search completed: "${query}" -> ${sortedUsers.length} results`)

    return NextResponse.json({ 
      users: sortedUsers,
      total: sortedUsers.length,
      query: query,
      type: 'search',
      debug: process.env.NODE_ENV === 'development' ? {
        currentUser: currentDbUser.name,
        searchWords: queryWords,
        foundCount: users.length
      } : undefined
    })
  } catch (error) {
    console.error('User search error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}
