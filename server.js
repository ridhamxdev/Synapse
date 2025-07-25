const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const { PrismaClient } = require('@prisma/client')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()
const prisma = new PrismaClient()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      if (!req.url || typeof req.url !== 'string') {
        console.error('Invalid request URL:', req.url)
        res.statusCode = 400
        res.end('Bad Request')
        return
      }

      if (req.url.startsWith('/api/')) {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        
        if (req.method === 'OPTIONS') {
          res.statusCode = 200
          res.end()
          return
        }
      }

      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error handling request:', req.url, err)
      res.statusCode = 500
      res.end('Internal server error')
    }
  })

  httpServer.on('upgrade', (request, socket, head) => {
    try {
      console.log('Handling upgrade request:', request.url)
      
      if (!request.url || typeof request.url !== 'string') {
        console.error('Invalid upgrade request URL:', request.url)
        socket.destroy()
        return
      }

      if (request.url.startsWith('/socket.io/')) {
        return
      }

      socket.destroy()
    } catch (error) {
      console.error('Error handling upgrade request:', error)
      socket.destroy()
    }
  })

  const io = new Server(httpServer, {
    cors: {
      origin: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.137.1:3000",
        "http://192.168.0.104:3000",
      ],
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    allowEIO3: true,
    allowRequest: (req, callback) => {
      try {
        if (!req.headers.origin) {
          console.log('No origin header, allowing request')
          return callback(null, true)
        }

        const origin = req.headers.origin
        const allowedOrigins = [
          'http://localhost:3000',
          'http://127.0.0.1:3000',
          'http://192.168.137.1:3000',
          'http://192.168.0.104:3000',
        ]

        if (allowedOrigins.includes(origin)) {
          callback(null, true)
        } else {
          console.log('Unknown origin, allowing anyway:', origin)
          callback(null, true)
        }
      } catch (error) {
        console.error('Error in allowRequest:', error)
        callback(null, true)
      }
    }
  })

  const activeUsers = new Map()
  const userHeartbeats = new Map()

  io.engine.on('connection_error', (err) => {
    console.error('Socket.io connection error:', err.req?.url, err.code, err.message)
  })

  io.on('connection', (socket) => {
    console.log('New connection:', socket.id)

    socket.on('error', (error) => {
      console.error('Socket error for', socket.id, ':', error)
    })

    socket.on('authenticate', async (data) => {
      try {
        if (!data || typeof data !== 'object') {
          socket.emit('auth-error', { message: 'Invalid authentication data' })
          return
        }

        const { userId, userName, userImage } = data

        if (!userId || typeof userId !== 'string') {
          socket.emit('auth-error', { message: 'Invalid user ID' })
          return
        }

        socket.userId = userId

        activeUsers.set(userId, {
          socketId: socket.id,
          userName: userName || 'Unknown User',
          userImage: userImage || null,
          connectedAt: new Date()
        })

        userHeartbeats.set(userId, Date.now())

        try {
          await prisma.user.update({
            where: { clerkId: userId },
            data: {
              isOnline: true,
              lastSeen: new Date()
            }
          })
        } catch (dbError) {
          console.error('Database error during authentication:', dbError)
        }

        console.log('User authenticated:', userName, '(' + userId + ')')

        const onlineUsers = Array.from(activeUsers.entries()).map(([id, info]) => ({
          userId: id,
          userName: info.userName,
          userImage: info.userImage,
          isOnline: true
        }))

        socket.emit('online-users', onlineUsers)
        socket.broadcast.emit('user-online', {
          userId,
          userName: userName || 'Unknown User',
          userImage
        })

      } catch (error) {
        console.error('Authentication error:', error)
        socket.emit('auth-error', { message: 'Authentication failed' })
      }
    })

    socket.on('join-conversation', async (conversationId) => {
      try {
        if (!conversationId || typeof conversationId !== 'string') {
          socket.emit('join-error', { error: 'Invalid conversation ID' })
          return
        }

        socket.join(`conversation:${conversationId}`)
        console.log('User', socket.userId, 'joined conversation:', conversationId)

        if (socket.userId) {
          userHeartbeats.set(socket.userId, Date.now())
        }

      } catch (error) {
        console.error('Error joining conversation:', error)
        socket.emit('join-error', { error: 'Failed to join conversation' })
      }
    })

    socket.on('leave-conversation', (conversationId) => {
      try {
        if (conversationId && typeof conversationId === 'string') {
          socket.leave(`conversation:${conversationId}`)
          console.log('User', socket.userId, 'left conversation:', conversationId)
        }
      } catch (error) {
        console.error('Error leaving conversation:', error)
      }
    })

    socket.on('message:send', async (data) => {
      try {
        if (!data || typeof data !== 'object') {
          socket.emit('message-error', { error: 'Invalid message data' })
          return
        }

        const { conversationId, id } = data

        if (!conversationId || typeof conversationId !== 'string') {
          socket.emit('message-error', { error: 'Invalid conversation ID' })
          return
        }

        console.log('Broadcasting message to conversation:', conversationId)
        console.log('Message ID:', id)

        socket.to(`conversation:${conversationId}`).emit('message:new', data)

        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: {
            users: { select: { userId: true } },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { sender: { select: { name: true } } }
            }
          }
        })

        if (conversation) {
          const updateData = {
            id: conversation.id,
            lastMessage: conversation.messages[0],
            updatedAt: conversation.updatedAt
          }

          conversation.users.forEach(({ userId }) => {
            socket.to(`user:${userId}`).emit('conversation:updated', updateData)
          })
        }

      } catch (error) {
        console.error('Message broadcast error:', error)
        socket.emit('message-error', { error: 'Failed to send message' })
      }
    })

    socket.on('typing', (data) => {
      try {
        if (!data || typeof data !== 'object') {
          return
        }

        const { conversationId, isTyping } = data

        if (!conversationId || typeof conversationId !== 'string') {
          return
        }

        if (socket.userId) {
          userHeartbeats.set(socket.userId, Date.now())
        }

        socket.to(`conversation:${conversationId}`).emit('user:typing', {
          userId: socket.userId,
          isTyping: Boolean(isTyping)
        })

      } catch (error) {
        console.error('Typing error:', error)
      }
    })

    socket.on('ping', (data) => {
      try {
        if (socket.userId) {
          userHeartbeats.set(socket.userId, Date.now())
        }
        socket.emit('pong')
      } catch (error) {
        console.error('Ping error:', error)
      }
    })

    socket.on('disconnect', async (reason) => {
      console.log('User disconnected:', socket.id, 'Reason:', reason)

      if (socket.userId) {
        activeUsers.delete(socket.userId)
        userHeartbeats.delete(socket.userId)

        try {
          await prisma.user.update({
            where: { clerkId: socket.userId },
            data: {
              isOnline: false,
              lastSeen: new Date()
            }
          })
        } catch (dbError) {
          console.error('Database error during disconnect:', dbError)
        }

        socket.broadcast.emit('user-offline', { userId: socket.userId })
      }
    })
  })

  const heartbeatInterval = setInterval(() => {
    const now = Date.now()
    for (const [userId, lastHeartbeat] of userHeartbeats.entries()) {
      if (now - lastHeartbeat > 300000) {
        console.log('Removing inactive user:', userId)
        activeUsers.delete(userId)
        userHeartbeats.delete(userId)
      }
    }
  }, 60000)

  const gracefulShutdown = async (signal) => {
    console.log(signal, 'received, shutting down gracefully...')
    clearInterval(heartbeatInterval)

    try {
      io.emit('server-shutdown', { message: 'Server is shutting down' })

      await new Promise((resolve) => {
        io.close(resolve)
      })

      await prisma.$disconnect()

      await new Promise((resolve) => {
        httpServer.close(resolve)
      })

      console.log('Graceful shutdown completed')
      process.exit(0)
    } catch (error) {
      console.error('Error during shutdown:', error)
      process.exit(1)
    }
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error)
    gracefulShutdown('UNCAUGHT_EXCEPTION')
  })

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  })

  httpServer.listen(port, hostname, (err) => {
    if (err) {
      console.error('Failed to start server:', err)
      process.exit(1)
    }
    
    console.log('Server ready on http://localhost:' + port)
    console.log('Network access: http://192.168.137.1:' + port)
    console.log('Socket.io server running')
  })

}).catch((err) => {
  console.error('Failed to prepare Next.js app:', err)
  process.exit(1)
})
