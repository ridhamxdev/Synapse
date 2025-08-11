const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const { PrismaClient } = require('@prisma/client')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const os = require('os')

const ANSI = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function time() {
  return new Date().toISOString()
}

const log = {
  info: (...args) => console.log(`${ANSI.cyan}[INFO]${ANSI.reset} ${ANSI.dim}${time()}${ANSI.reset} -`, ...args),
  warn: (...args) => console.warn(`${ANSI.yellow}[WARN]${ANSI.reset} ${ANSI.dim}${time()}${ANSI.reset} -`, ...args),
  error: (...args) => console.error(`${ANSI.red}[ERROR]${ANSI.reset} ${ANSI.dim}${time()}${ANSI.reset} -`, ...args),
  ready: (...args) => console.log(`${ANSI.green}[READY]${ANSI.reset} ${ANSI.dim}${time()}${ANSI.reset} -`, ...args)
}
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

function displayNetworkInfo() {
  log.info('Network information:')
  log.info(`Local:   http://localhost:${port}`)
  log.info(`Network: http://${localIP}:${port}`)
  log.info(`Socket:  ws://${localIP}:${port}`)
  log.info(`Health:  http://${localIP}:${port}/health`)
  log.info(`Info:    http://${localIP}:${port}/server-info`)
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
      
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
      
      if (req.method === 'OPTIONS') {
        res.statusCode = 200
        return res.end()
      }
      
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
      log.error('Request handling error:', error)
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
    log.error('Socket.io connection error:', err)
  })

  httpServer.on('error', (err) => {
    log.error('HTTP Server error:', err)
  })

  io.on('connect_error', (err) => {
    log.error('Socket.io connect error:', err)
  })

  io.on('connection', socket => {
    log.info(`Socket connected: ${socket.id}`)
    
    socket.on('authenticate', async data => {
      const { userId, userName, userImage } = data
      if (!userId) return socket.emit('auth-error', { message: 'Invalid user ID' })
      socket.userId = userId
      activeUsers.set(userId, { socketId: socket.id, userName, userImage })
      userHeartbeats.set(userId, Date.now())
      
      socket.join(`user:${userId}`)
      
      try {
        await prisma.user.upsert({
          where: { clerkId: userId },
          update: { isOnline: true, lastSeen: new Date() },
          create: {
            clerkId: userId,
            name: userName || 'Unknown User',
            email: '',
            isOnline: true,
            lastSeen: new Date()
          }
        })
      } catch (e) {
        log.error('User upsert error:', e)
      }
      const online = Array.from(activeUsers.entries()).map(([id, info]) => ({
        userId: id, userName: info.userName, userImage: info.userImage, isOnline: true
      }))
      socket.emit('online-users', online)
      socket.broadcast.emit('user-online', { userId, userName, userImage })
    })

    socket.on('join-conversation', convId => {
      if (!convId) return
      try {
        socket.join(`conversation:${convId}`)
      } catch (e) {
        log.error('join-conversation error:', e)
      }
    })
    socket.on('leave-conversation', convId => {
      if (!convId) return
      try {
        socket.leave(`conversation:${convId}`)
      } catch (e) {
        log.error('leave-conversation error:', e)
      }
    })

    socket.on('message:send', async data => {
      const { conversationId, id } = data
      if (!conversationId) return socket.emit('message-error', { error: 'Invalid conversation ID' })
      
      socket.to(`conversation:${conversationId}`).emit('message:new', data)
      
      try {
        const conv = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: {
            users: { 
              select: { 
                userId: true,
                user: {
                  select: {
                    clerkId: true
                  }
                }
              } 
            },
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
          

          conv.users.forEach(({ user }) => {
            io.to(`user:${user.clerkId}`).emit('conversation:updated', updateData)
          })
        }
      } catch (e) {
        log.error('Broadcast error:', e)
      }
    })

    socket.on('reaction:toggle', async (data, ack) => {
      try {
        const { conversationId, messageId, emoji } = data || {}
        if (!conversationId || !messageId || !emoji) {
          if (ack) ack({ ok: false, error: 'Invalid payload' })
          return
        }

        const currentUserClerkId = socket.userId
        if (!currentUserClerkId) {
          if (ack) ack({ ok: false, error: 'Unauthorized' })
          return
        }

        const currentDbUser = await prisma.user.findUnique({ where: { clerkId: currentUserClerkId } })
        if (!currentDbUser) {
          if (ack) ack({ ok: false, error: 'User not found' })
          return
        }

        const access = await prisma.conversationUser.findFirst({ where: { conversationId, userId: currentDbUser.id } })
        if (!access) {
          if (ack) ack({ ok: false, error: 'Access denied' })
          return
        }

        const existing = await prisma.messageReaction.findUnique({
          where: { messageId_userId_emoji: { messageId, userId: currentDbUser.id, emoji } }
        })

        if (existing) {
          await prisma.messageReaction.delete({ where: { id: existing.id } })
        } else {
          await prisma.messageReaction.create({ data: { messageId, userId: currentDbUser.id, emoji } })
        }

        const reactions = await prisma.messageReaction.findMany({
          where: { messageId },
          select: { id: true, emoji: true, userId: true }
        })

        io.to(`conversation:${conversationId}`).emit('reaction:update', { messageId, reactions })
        if (ack) ack({ ok: true, reactions })
      } catch (e) {
        log.error('reaction:toggle error', e)
        if (ack) ack({ ok: false, error: 'Server error' })
      }
    })

    socket.on('typing:start', data => {
      const { conversationId, userId, userName } = data
      if (conversationId && userId) {
        userHeartbeats.set(socket.userId, Date.now())
        socket.to(`conversation:${conversationId}`).emit('typing:start', {
          userId: userId,
          userName: userName
        })
      }
    })

    socket.on('typing:stop', data => {
      const { conversationId, userId } = data
      if (conversationId && userId) {
        userHeartbeats.set(socket.userId, Date.now())
        socket.to(`conversation:${conversationId}`).emit('typing:stop', {
          userId: userId
        })
      }
    })

    socket.on('disconnect', async () => {
      const uid = socket.userId
      log.info(`Socket disconnected: ${socket.id} (User: ${uid || 'Unknown'})`)
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
          log.error('User disconnect upsert error:', e)
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
    log.ready('Server started')
    log.info(`Environment: ${dev ? 'development' : 'production'}`)
    displayNetworkInfo()
  })
})
