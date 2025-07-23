import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    console.log('🔄 Starting user synchronization...')
    
    // Get all users from Clerk
    const clerkResponse = await (await clerkClient()).users.getUserList({
      limit: 100
    })
    
    console.log(`📊 Found ${clerkResponse.data.length} users in Clerk`)
    
    const syncResults = []
    
    for (const clerkUser of clerkResponse.data) {
      try {
        // Check if user exists in database
        const existingUser = await prisma.user.findUnique({
          where: { clerkId: clerkUser.id }
        })

        const userData = {
          clerkId: clerkUser.id,
          name: clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Anonymous User',
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          imageUrl: clerkUser.imageUrl || null,
          phone: clerkUser.phoneNumbers[0]?.phoneNumber || null,
          bio: "Hey there! I'm using WhatsApp Clone.",
          isOnline: false,
          lastSeen: new Date()
        }

        if (!existingUser) {
          // Create new user
          const newUser = await prisma.user.create({
            data: userData
          })
          
          syncResults.push({
            action: 'created',
            userId: newUser.id,
            name: newUser.name,
            email: newUser.email,
            clerkId: clerkUser.id
          })
          
          console.log(`✅ Created user: ${newUser.name} (${newUser.id})`)
        } else {
          // Update existing user
          const updatedUser = await prisma.user.update({
            where: { clerkId: clerkUser.id },
            data: {
              name: userData.name,
              email: userData.email,
              imageUrl: userData.imageUrl,
              phone: userData.phone,
            }
          })
          
          syncResults.push({
            action: 'updated',
            userId: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            clerkId: clerkUser.id
          })
          
          console.log(`🔄 Updated user: ${updatedUser.name} (${updatedUser.id})`)
        }
      } catch (userError) {
        console.error(`❌ Error processing user ${clerkUser.id}:`, userError)
        syncResults.push({
          action: 'error',
          clerkId: clerkUser.id,
          error: (userError as Error).message,
          name: clerkUser.fullName || 'Unknown'
        })
      }
    }

    // Get final user count from database
    const totalDbUsers = await prisma.user.count()

    return NextResponse.json({
      success: true,
      message: 'User synchronization completed successfully',
      totalClerkUsers: clerkResponse.data.length,
      totalDbUsers: totalDbUsers,
      syncResults: syncResults,
      summary: {
        created: syncResults.filter(r => r.action === 'created').length,
        updated: syncResults.filter(r => r.action === 'updated').length,
        errors: syncResults.filter(r => r.action === 'error').length
      }
    })

  } catch (error) {
    console.error('🔴 Synchronization failed:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Synchronization failed', 
      details: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
