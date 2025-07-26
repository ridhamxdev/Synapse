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
    if (!req.url || typeof req.url !== 'string') {
      res.statusCode = 400
      return res.end('Bad Request')
    }
    if (req.url.startsWith('/api/')) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
      if (req.method === 'OPTIONS') {
        res.statusCode = 200
        return res.end()
      }
    }
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(httpServer, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://192.168.137.1:3000',
        'http://192.168.0.104:3000'
      ],
      methods: ['GET', 'POST'],
      credentials: true
    }
  })

  const activeUsers = new Map()
  const userHeartbeats = new Map()

  io.engine.on('connection_error', err => {
    console.error('Socket.io connection error:', err)
  })

  io.on('connection', socket => {
    socket.on('authenticate', async data => {
      const { userId, userName, userImage } = data
      if (!userId) return socket.emit('auth-error', { message: 'Invalid user ID' })
      socket.userId = userId
      activeUsers.set(userId, { socketId: socket.id, userName, userImage })
      userHeartbeats.set(userId, Date.now())
      try {
        await prisma.user.update({
          where: { clerkId: userId },
          data: { isOnline: true, lastSeen: new Date() }
        })
      } catch (e) {
        console.error(e)
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
      if (uid) {
        activeUsers.delete(uid)
        userHeartbeats.delete(uid)
        try {
          await prisma.user.update({
            where: { clerkId: uid },
            data: { isOnline: false, lastSeen: new Date() }
          })
        } catch (e) {
          console.error(e)
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

  httpServer.listen(port, hostname, err => {
    if (err) throw err
    console.log(`Server listening on http://${hostname}:${port}`)
  })
})
