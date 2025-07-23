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
      // Enhanced request handling with better error checking
      if (!req.url || typeof req.url !== 'string') {
        console.error('❌ Invalid request URL:', req.url)
        res.statusCode = 400
        res.end('Bad Request')
        return
      }

      // Add CORS headers for API routes
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
      console.error('❌ Error handling request:', req.url, err)
      res.statusCode = 500
      res.end('Internal server error')
    }
  })

  // Enhanced error handling for upgrade requests
  httpServer.on('upgrade', (request, socket, head) => {
    try {
      console.log('🔄 Handling upgrade request:', request.url)
      
      // Validate upgrade request
      if (!request.url || typeof request.url !== 'string') {
        console.error('❌ Invalid upgrade request URL:', request.url)
        socket.destroy()
        return
      }

      // Let Socket.io handle the upgrade
      if (request.url.startsWith('/socket.io/')) {
        // Socket.io will handle this
        return
      }

      // Destroy other upgrade requests
      socket.destroy()
    } catch (error) {
      console.error('❌ Error handling upgrade request:', error)
      socket.destroy()
    }
  })

  // Enhanced Socket.io configuration with better error handling
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
    
    // Conservative timeout settings
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    allowEIO3: true,
    
    // Enhanced error handling
    allowRequest: (req, callback) => {
      try {
        // Validate request
        if (!req.headers.origin) {
          console.log('⚠️  No origin header, allowing request')
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
          console.log('⚠️  Unknown origin, allowing anyway:', origin)
          callback(null, true) // Allow for development
        }
      } catch (error) {
        console.error('❌ Error in allowRequest:', error)
        callback(null, true) // Allow on error for development
      }
    }
  })

  // Store active users with heartbeat tracking
  const activeUsers = new Map()
  const userHeartbeats = new Map()

  // Global error handler for Socket.io
  io.engine.on('connection_error', (err) => {
    console.error('❌ Socket.io connection error:', err.req?.url, err.code, err.message)
  })

  io.on('connection', (socket) => {
    console.log('🟢 New connection:', socket.id)

    // Enhanced error handling for socket events
    socket.on('error', (error) => {
      console.error('❌ Socket error for', socket.id, ':', error)
    })

    // Authentication with better validation
    socket.on('authenticate', async (data) => {
      try {
        // Validate authentication data
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
        
        // Store user info
        activeUsers.set(userId, {
          socketId: socket.id,
          userName: userName || 'Unknown User',
          userImage: userImage || null,
          connectedAt: new Date()
        })

        userHeartbeats.set(userId, Date.now())

        // Update user online status with error handling
        try {
          await prisma.user.update({
            where: { clerkId: userId },
            data: { 
              isOnline: true,
              lastSeen: new Date()
            }
          })
        } catch (dbError) {
          console.error('❌ Database error during authentication:', dbError)
          // Don't fail authentication for DB errors
        }

        console.log(`✅ User authenticated: ${userName} (${userId})`)
        
        // Send online users to new user
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
        console.error('❌ Authentication error:', error)
        socket.emit('auth-error', { message: 'Authentication failed' })
      }
    })

    // Join conversation with validation
    socket.on('join-conversation', async (conversationId) => {
      try {
        if (!conversationId || typeof conversationId !== 'string') {
          socket.emit('join-error', { error: 'Invalid conversation ID' })
          return
        }

        socket.join(`conversation:${conversationId}`)
        console.log(`👥 User ${socket.userId} joined conversation: ${conversationId}`)
        
        // Update heartbeat
        if (socket.userId) {
          userHeartbeats.set(socket.userId, Date.now())
        }
      } catch (error) {
        console.error('❌ Error joining conversation:', error)
        socket.emit('join-error', { error: 'Failed to join conversation' })
      }
    })

    // Handle new messages with validation
    socket.on('send-message', async (data) => {
      try {
        if (!data || typeof data !== 'object') {
          socket.emit('message-error', { error: 'Invalid message data' })
          return
        }

        const { conversationId, content, type = 'TEXT', fileUrl, fileName } = data

        if (!conversationId || typeof conversationId !== 'string') {
          socket.emit('message-error', { error: 'Invalid conversation ID' })
          return
        }

        if (!socket.userId) {
          socket.emit('message-error', { error: 'Not authenticated' })
          return
        }

        // Update heartbeat
        userHeartbeats.set(socket.userId, Date.now())

        // Get sender from database with error handling
        const sender = await prisma.user.findUnique({
          where: { clerkId: socket.userId },
          select: { id: true, name: true, imageUrl: true }
        })

        if (!sender) {
          socket.emit('message-error', { error: 'User not found' })
          return
        }

        // Create message with error handling
        const message = await prisma.message.create({
          data: {
            content: content || null,
            type,
            fileUrl: fileUrl || null,
            fileName: fileName || null,
            senderId: sender.id,
            conversationId,
          },
          include: {
            sender: {
              select: { id: true, name: true, imageUrl: true }
            }
          }
        })

        console.log('💬 Message created:', message.id)

        // Emit to conversation participants
        io.to(`conversation:${conversationId}`).emit('new-message', message)

      } catch (error) {
        console.error('❌ Message error:', error)
        socket.emit('message-error', { error: 'Failed to send message' })
      }
    })

    // Handle typing indicators with validation
    socket.on('typing', (data) => {
      try {
        if (!data || typeof data !== 'object') {
          return
        }

        const { conversationId, isTyping } = data
        
        if (!conversationId || typeof conversationId !== 'string') {
          return
        }
        
        // Update heartbeat
        if (socket.userId) {
          userHeartbeats.set(socket.userId, Date.now())
        }
        
        socket.to(`conversation:${conversationId}`).emit('user-typing', {
          userId: socket.userId,
          isTyping: Boolean(isTyping)
        })
      } catch (error) {
        console.error('❌ Typing error:', error)
      }
    })

    // Handle ping with validation
    socket.on('ping', (data) => {
      try {
        if (socket.userId) {
          userHeartbeats.set(socket.userId, Date.now())
        }
        socket.emit('pong')
      } catch (error) {
        console.error('❌ Ping error:', error)
      }
    })

    // Handle disconnect with cleanup
    socket.on('disconnect', async (reason) => {
      console.log('❌ User disconnected:', socket.id, 'Reason:', reason)
      
      if (socket.userId) {
        activeUsers.delete(socket.userId)
        userHeartbeats.delete(socket.userId)
        
        // Update user offline status with error handling
        try {
          await prisma.user.update({
            where: { clerkId: socket.userId },
            data: { 
              isOnline: false,
              lastSeen: new Date()
            }
          })
        } catch (dbError) {
          console.error('❌ Database error during disconnect:', dbError)
        }

        // Notify others of user going offline
        socket.broadcast.emit('user-offline', { userId: socket.userId })
      }
    })
  })

  // Heartbeat cleanup
  const heartbeatInterval = setInterval(() => {
    const now = Date.now()
    for (const [userId, lastHeartbeat] of userHeartbeats.entries()) {
      if (now - lastHeartbeat > 300000) { // 5 minutes
        console.log(`⚠️ Removing inactive user: ${userId}`)
        activeUsers.delete(userId)
        userHeartbeats.delete(userId)
      }
    }
  }, 60000) // Clean up every minute

  // Graceful shutdown
  const gracefulShutdown = async (signal) => {
    console.log(`🛑 ${signal} received, shutting down gracefully...`)
    
    clearInterval(heartbeatInterval)
    
    try {
      // Notify all clients
      io.emit('server-shutdown', { message: 'Server is shutting down' })
      
      // Close Socket.io
      await new Promise((resolve) => {
        io.close(resolve)
      })
      
      // Close database connection
      await prisma.$disconnect()
      
      // Close HTTP server
      await new Promise((resolve) => {
        httpServer.close(resolve)
      })
      
      console.log('✅ Graceful shutdown completed')
      process.exit(0)
    } catch (error) {
      console.error('❌ Error during shutdown:', error)
      process.exit(1)
    }
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error)
    gracefulShutdown('UNCAUGHT_EXCEPTION')
  })

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  })

  httpServer.listen(port, hostname, () => {
    console.log(`🚀 Server ready on http://${hostname}:${port}`)
    console.log(`🌐 Network access: http://192.168.137.1:${port}`)
    console.log(`⚡ Socket.io server running with enhanced error handling`)
  })
})
