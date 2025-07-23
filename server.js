const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const { PrismaClient } = require('@prisma/client')

const app = next({ dev: process.env.NODE_ENV !== 'production' })
const handle = app.getRequestHandler()
const prisma = new PrismaClient()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  })

  // Store active users
  const activeUsers = new Map()

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    // User authentication
    socket.on('authenticate', async (data) => {
      try {
        const { userId } = data
        socket.userId = userId
        activeUsers.set(userId, socket.id)

        // Update user online status
        await prisma.user.update({
          where: { id: userId },
          data: { isOnline: true }
        })

        // Join user's conversations
        const conversations = await prisma.conversationUser.findMany({
          where: { userId },
          include: { conversation: true }
        })

        conversations.forEach(({ conversationId }) => {
          socket.join(`conversation:${conversationId}`)
        })

        // Notify contacts of online status
        socket.broadcast.emit('user-online', { userId })
      } catch (error) {
        console.error('Authentication error:', error)
      }
    })

    // Join conversation
    socket.on('join-conversation', async (conversationId) => {
      socket.join(`conversation:${conversationId}`)
      
      // Mark messages as read
      if (socket.userId) {
        await prisma.messageRead.createMany({
          data: {
            messageId: { in: await getUnreadMessageIds(conversationId, socket.userId) },
            userId: socket.userId
          },
          skipDuplicates: true
        })
      }
    })

    // Handle new messages
    socket.on('send-message', async (data) => {
      try {
        const { conversationId, content, type, fileUrl, fileName, replyToId } = data

        // Create message in database
        const message = await prisma.message.create({
          data: {
            content,
            type: type || 'TEXT',
            fileUrl,
            fileName,
            senderId: socket.userId,
            conversationId,
            replyToId
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                imageUrl: true
              }
            },
            replyTo: {
              include: {
                sender: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        })

        // Update conversation last activity
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() }
        })

        // Emit to conversation room
        io.to(`conversation:${conversationId}`).emit('new-message', message)

        // Send push notifications to offline users
        const conversationUsers = await prisma.conversationUser.findMany({
          where: { conversationId },
          include: { user: true }
        })

        conversationUsers.forEach(({ user }) => {
          if (!user.isOnline && user.id !== socket.userId) {
            // Send push notification logic here
            console.log(`Send notification to ${user.name}`)
          }
        })

      } catch (error) {
        console.error('Message sending error:', error)
        socket.emit('message-error', { error: 'Failed to send message' })
      }
    })

    // Handle typing indicators
    socket.on('typing', (data) => {
      const { conversationId, isTyping } = data
      socket.to(`conversation:${conversationId}`).emit('user-typing', {
        userId: socket.userId,
        isTyping
      })
    })

    // Create new conversation
    socket.on('create-conversation', async (data) => {
      try {
        const { participantIds, type = 'DIRECT' } = data

        const conversation = await prisma.conversation.create({
          data: {
            type,
            users: {
              createMany: {
                data: [
                  { userId: socket.userId },
                  ...participantIds.map(id => ({ userId: id }))
                ]
              }
            }
          },
          include: {
            users: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                    isOnline: true
                  }
                }
              }
            }
          }
        })

        // Join all participants to the conversation room
        const allParticipants = [socket.userId, ...participantIds]
        allParticipants.forEach(userId => {
          const userSocket = activeUsers.get(userId)
          if (userSocket) {
            io.sockets.sockets.get(userSocket)?.join(`conversation:${conversation.id}`)
          }
        })

        // Emit new conversation to all participants
        io.to(`conversation:${conversation.id}`).emit('new-conversation', conversation)

      } catch (error) {
        console.error('Conversation creation error:', error)
        socket.emit('conversation-error', { error: 'Failed to create conversation' })
      }
    })

    // Create group
    socket.on('create-group', async (data) => {
      try {
        const { name, description, memberIds, imageUrl } = data

        const group = await prisma.group.create({
          data: {
            name,
            description,
            imageUrl,
            creatorId: socket.userId,
            members: {
              createMany: {
                data: [
                  { userId: socket.userId, role: 'ADMIN' },
                  ...memberIds.map(id => ({ userId: id, role: 'MEMBER' }))
                ]
              }
            }
          },
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    imageUrl: true
                  }
                }
              }
            }
          }
        })

        // Join all members to the group room
        const allMembers = [socket.userId, ...memberIds]
        allMembers.forEach(userId => {
          const userSocket = activeUsers.get(userId)
          if (userSocket) {
            io.sockets.sockets.get(userSocket)?.join(`group:${group.id}`)
          }
        })

        // Emit new group to all members
        io.to(`group:${group.id}`).emit('new-group', group)

      } catch (error) {
        console.error('Group creation error:', error)
        socket.emit('group-error', { error: 'Failed to create group' })
      }
    })

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id)
      
      if (socket.userId) {
        activeUsers.delete(socket.userId)
        
        // Update user offline status
        await prisma.user.update({
          where: { id: socket.userId },
          data: { 
            isOnline: false,
            lastSeen: new Date()
          }
        })

        // Notify contacts of offline status
        socket.broadcast.emit('user-offline', { userId: socket.userId })
      }
    })
  })

  async function getUnreadMessageIds(conversationId, userId) {
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readBy: {
          none: { userId }
        }
      },
      select: { id: true }
    })
    return messages.map(m => m.id)
  }

  server.listen(3000, (err) => {
    if (err) throw err
    console.log('> Ready on http://localhost:3000')
  })
})
