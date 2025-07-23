import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { prisma } from '@/lib/prisma'

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to your environment variables')
  }

  // Get the headers
  const headerPayload = headers()
  const svix_id = (await headerPayload).get('svix-id')
  const svix_timestamp = (await headerPayload).get('svix-timestamp')
  const svix_signature = (await headerPayload).get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(webhookSecret)

  let evt: any

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as any
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  const { id } = evt.data
  const eventType = evt.type

  console.log(`Webhook with an ID of ${id} and type of ${eventType}`)
  console.log('Webhook body:', body)

  // Handle user creation
  if (eventType === 'user.created') {
    try {
      const { id, email_addresses, first_name, last_name, image_url, phone_numbers } = evt.data

      await prisma.user.create({
        data: {
          clerkId: id,
          name: `${first_name || ''} ${last_name || ''}`.trim() || 'Anonymous',
          email: email_addresses[0]?.email_address || '',
          imageUrl: image_url || null,
          phone: phone_numbers[0]?.phone_number || null,
          bio: "Hey there! I'm using WhatsApp Clone.",
          isOnline: false,
          lastSeen: new Date()
        }
      })

      console.log('User created in database:', id)
    } catch (error) {
      console.error('Error creating user in database:', error)
    }
  }

  // Handle user updates
  if (eventType === 'user.updated') {
    try {
      const { id, email_addresses, first_name, last_name, image_url, phone_numbers } = evt.data

      await prisma.user.update({
        where: { clerkId: id },
        data: {
          name: `${first_name || ''} ${last_name || ''}`.trim() || 'Anonymous',
          email: email_addresses[0]?.email_address || '',
          imageUrl: image_url || null,
          phone: phone_numbers[0]?.phone_number || null,
        }
      })

      console.log('User updated in database:', id)
    } catch (error) {
      console.error('Error updating user in database:', error)
    }
  }

  // Handle user deletion
  if (eventType === 'user.deleted') {
    try {
      const { id } = evt.data

      await prisma.user.delete({
        where: { clerkId: id }
      })

      console.log('User deleted from database:', id)
    } catch (error) {
      console.error('Error deleting user from database:', error)
    }
  }

  return new Response('Webhook received', { status: 200 })
}
