const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const { PrismaClient } = require('@prisma/client')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

// Get local IP address for network access
const os = require('os')
function getLocalIP() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      const { address, family, internal } = interface
      if (family === 'IPv4' && !internal) {
        return address
      }
    }
  }
  return 'localhost'
}

const localIP = getLocalIP()

// Display network information
function displayNetworkInfo() {
  console.log('\n🌐 Network Information:')
  console.log('='.repeat(50))
  console.log(`📱 Mobile/Tablet Access: http://${localIP}:${port}`)
  console.log(`💻 Desktop Access: http://localhost:${port}`)
  console.log(`🔌 Socket.IO Endpoint: ws://${localIP}:${port}`)
  console.log(`📊 Health Check: http://${localIP}:${port}/health`)
  console.log(`ℹ️  Server Info: http://${localIP}:${port}/server-info`)
  console.log('='.repeat(50))
  console.log('💡 Tips:')
  console.log('• Make sure your firewall allows connections on port 3000')
  console.log('• Other devices must be on the same network')
  console.log('• Use the Network URL to access from mobile/tablet')
  console.log('='.repeat(50))
}

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()
const prisma = new PrismaClient()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      if (!req.url || typeof req.url !== 'string') {
        res.statusCode = 400
        return res.end('Bad Request')
      }
      
      // Add CORS headers for all requests
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
      
      if (req.method === 'OPTIONS') {
        res.statusCode = 200
        return res.end()
      }
      
      // Health check endpoint
      if (req.url === '/health') {
        res.setHeader('Content-Type', 'application/json')
        return res.end(JSON.stringify({
          status: 'OK',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          activeUsers: activeUsers.size,
          socketConnections: io.engine.clientsCount
        }))
      }
      
      // Server info endpoint
      if (req.url === '/server-info') {
        res.setHeader('Content-Type', 'application/json')
        return res.end(JSON.stringify({
          server: 'WhatsApp Clone Server',
          version: '1.0.0',
          localUrl: `http://localhost:${port}`,
          networkUrl: `http://${localIP}:${port}`,
          socketUrl: `ws://${localIP}:${port}`,
          development: dev,
          activeUsers: activeUsers.size,
          socketConnections: io.engine.clientsCount
        }))
      }
      
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (error) {
      console.error('Request handling error:', error)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })

  const io = new Server(httpServer, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        `http://${localIP}:3000`,
        `http://${localIP}:3001`,
        // Common local network ranges
        'http://192.168.0.1:3000',
        'http://192.168.0.2:3000',
        'http://192.168.0.100:3000',
        'http://192.168.0.101:3000',
        'http://192.168.0.102:3000',
        'http://192.168.0.103:3000',
        'http://192.168.0.104:3000',
        'http://192.168.0.105:3000',
        'http://192.168.1.1:3000',
        'http://192.168.1.100:3000',
        'http://192.168.1.101:3000',
        'http://192.168.1.102:3000',
        'http://192.168.1.103:3000',
        'http://192.168.1.104:3000',
        'http://192.168.1.105:3000',
        'http://10.0.0.1:3000',
        'http://10.0.0.100:3000',
        'http://10.0.0.101:3000',
        'http://10.0.0.102:3000',
        'http://10.0.0.103:3000',
        'http://10.0.0.104:3000',
        'http://10.0.0.105:3000',
        // Allow all origins in development
        ...(dev ? ['*'] : [])
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization']
    }
  })

  const activeUsers = new Map()
  const userHeartbeats = new Map()

  io.engine.on('connection_error', err => {
    console.error('Socket.io connection error:', err)
  })

  // Add error handling for the server
  httpServer.on('error', (err) => {
    console.error('HTTP Server error:', err)
  })

  io.on('connect_error', (err) => {
    console.error('Socket.io connect error:', err)
  })

  io.on('connection', socket => {
    console.log(`🔌 New socket connection: ${socket.id}`)
    
    socket.on('authenticate', async data => {
      const { userId, userName, userImage } = data
      if (!userId) return socket.emit('auth-error', { message: 'Invalid user ID' })
      socket.userId = userId
      activeUsers.set(userId, { socketId: socket.id, userName, userImage })
      userHeartbeats.set(userId, Date.now())
      try {
        await prisma.user.upsert({
          where: { clerkId: userId },
          update: { isOnline: true, lastSeen: new Date() },
          create: {
            clerkId: userId,
            name: userName || 'Unknown User',
            email: '', // Will be updated by sync
            isOnline: true,
            lastSeen: new Date()
          }
        })
      } catch (e) {
        console.error('User upsert error:', e)
      }
      const online = Array.from(activeUsers.entries()).map(([id, info]) => ({
        userId: id, userName: info.userName, userImage: info.userImage, isOnline: true
      }))
      socket.emit('online-users', online)
      socket.broadcast.emit('user-online', { userId, userName, userImage })
    })

    socket.on('join-conversation', convId => {
      if (convId) socket.join(`conversation:${convId}`)
    })
    socket.on('leave-conversation', convId => {
      if (convId) socket.leave(`conversation:${convId}`)
    })

    socket.on('message:send', async data => {
      const { conversationId, id } = data
      if (!conversationId) return socket.emit('message-error', { error: 'Invalid conversation ID' })
      socket.to(`conversation:${conversationId}`).emit('message:new', data)
      try {
        const conv = await prisma.conversation.findUnique({
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
        if (conv) {
          const updateData = {
            id: conv.id,
            lastMessage: conv.messages[0],
            updatedAt: conv.updatedAt
          }
          conv.users.forEach(({ userId }) => {
            io.to(`user:${userId}`).emit('conversation:updated', updateData)
          })
        }
      } catch (e) {
        console.error('Broadcast error:', e)
      }
    })

    socket.on('typing', data => {
      const { conversationId, isTyping } = data
      if (conversationId && socket.userId) {
        userHeartbeats.set(socket.userId, Date.now())
        socket.to(`conversation:${conversationId}`).emit('user:typing', {
          userId: socket.userId,
          isTyping: Boolean(isTyping)
        })
      }
    })

    socket.on('disconnect', async () => {
      const uid = socket.userId
      console.log(`🔌 Socket disconnected: ${socket.id} (User: ${uid || 'Unknown'})`)
      if (uid) {
        activeUsers.delete(uid)
        userHeartbeats.delete(uid)
        try {
          await prisma.user.upsert({
            where: { clerkId: uid },
            update: { isOnline: false, lastSeen: new Date() },
            create: {
              clerkId: uid,
              name: 'Unknown User',
              email: '',
              isOnline: false,
              lastSeen: new Date()
            }
          })
        } catch (e) {
          console.error('User disconnect upsert error:', e)
        }
        socket.broadcast.emit('user-offline', { userId: uid })
      }
    })
  })

  setInterval(() => {
    const now = Date.now()
    userHeartbeats.forEach((ts, uid) => {
      if (now - ts > 300_000) {
        activeUsers.delete(uid)
        userHeartbeats.delete(uid)
      }
    })
  }, 60_000)

  const shutdown = async () => {
    io.emit('server-shutdown', { message: 'Shutting down' })
    await io.close()
    await prisma.$disconnect()
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  httpServer.listen(port, '0.0.0.0', err => {
    if (err) throw err
    console.log('🚀 WhatsApp Clone Server Started!')
    console.log('='.repeat(50))
    console.log(`📍 Local: http://localhost:${port}`)
    console.log(`🌐 Network: http://${localIP}:${port}`)
    console.log(`🔌 Socket.IO: ws://${localIP}:${port}`)
    console.log('='.repeat(50))
    console.log('📱 Access from other devices using the Network URL above')
    console.log('🔧 Development mode:', dev ? 'ON' : 'OFF')
    console.log('⚡ Socket.IO server is ready for real-time messaging')
    console.log('='.repeat(50))
    displayNetworkInfo()
  })
})
