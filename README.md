# WhatsApp Clone - Full Stack Real-Time Chat Application

A modern, feature-rich WhatsApp clone built with Next.js, TypeScript, and real-time messaging capabilities. This project demonstrates advanced web development techniques including real-time communication, file uploads, voice messaging, and modern UI/UX design.

![WhatsApp Clone](https://img.shields.io/badge/Next.js-15.4.3-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![React](https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react)
![Socket.io](https://img.shields.io/badge/Socket.io-4.8.1-black?style=for-the-badge&logo=socket.io)
![Prisma](https://img.shields.io/badge/Prisma-6.12.0-black?style=for-the-badge&logo=prisma)
![Clerk](https://img.shields.io/badge/Clerk-Auth-blue?style=for-the-badge&logo=clerk)

## 🚀 Live Demo

[View Live Demo](https://your-demo-link.com) *(Coming Soon)*

## ✨ Features

### 🔐 Authentication & User Management
- **Clerk Authentication** - Secure user registration and login
- **User Profiles** - Customizable user profiles with avatars
- **Session Management** - Persistent login sessions
- **Protected Routes** - Middleware-based route protection

### 💬 Real-Time Messaging
- **Instant Messaging** - Real-time text message delivery
- **Message Status** - Read receipts and delivery confirmations
- **Typing Indicators** - Real-time typing status
- **Message History** - Persistent message storage
- **Conversation Management** - Create and manage chat conversations

### 📱 Media Sharing
- **Image Uploads** - Drag & drop image sharing
- **File Sharing** - Document and file uploads
- **Voice Messages** - Record and send voice messages
- **Local File Storage** - Secure local file management
- **File Size Validation** - 4MB file size limits
- **File Type Validation** - Supported format checking

### 🎵 Voice Messaging
- **Audio Recording** - Browser-based voice recording
- **Audio Playback** - Full-featured audio player
- **Progress Tracking** - Real-time audio progress
- **Seek Functionality** - Audio timeline navigation
- **Duration Display** - Accurate audio length display
- **Fallback Systems** - Robust error handling

### 🎨 Modern UI/UX
- **Responsive Design** - Mobile-first responsive layout
- **Dark/Light Theme** - Theme switching capability
- **Modern Components** - Radix UI component library
- **Smooth Animations** - CSS transitions and animations
- **Loading States** - Elegant loading indicators
- **Error Handling** - User-friendly error messages

### 🔧 Technical Features
- **TypeScript** - Full type safety
- **Real-time Communication** - Socket.io integration
- **Database Integration** - Prisma ORM with MySQL
- **API Routes** - RESTful API endpoints
- **Middleware** - Route protection and validation
- **Environment Management** - Secure configuration

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.4.3** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5.0** - Type safety
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Emoji Picker** - Emoji selection component

### Backend
- **Node.js** - JavaScript runtime
- **Socket.io** - Real-time communication
- **Prisma** - Database ORM
- **MySQL** - Database
- **Clerk** - Authentication service

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Webpack** - Module bundling

## 📁 Project Structure

```
whatsapp-clone-full/
├── 📁 src/
│   ├── 📁 app/                          # Next.js App Router
│   │   ├── 📁 (main)/                   # Main layout group
│   │   │   └── 📄 page.tsx              # Landing page
│   │   ├── 📁 api/                      # API routes
│   │   │   ├── 📁 conversations/        # Conversation endpoints
│   │   │   │   ├── 📁 [id]/             # Dynamic conversation routes
│   │   │   │   │   ├── 📁 messages/     # Message management
│   │   │   │   │   │   ├── 📁 [messageID]/ # Individual message routes
│   │   │   │   │   │   │   └── 📁 status/  # Message status updates
│   │   │   │   │   │   └── 📄 route.ts      # Message CRUD operations
│   │   │   │   │   ├── 📁 search/       # Conversation search
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   ├── 📁 voice/        # Voice message uploads
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   └── 📄 route.ts      # Conversation management
│   │   │   │   └── 📄 route.ts          # Conversation listing
│   │   │   ├── 📁 debug/                # Debug endpoints
│   │   │   │   └── 📁 sync-all-users/   # User synchronization
│   │   │   │       └── 📄 route.ts
│   │   │   ├── 📁 upload/               # File upload endpoint
│   │   │   │   └── 📄 route.ts          # Local file storage
│   │   │   ├── 📁 users/                # User management
│   │   │   │   ├── 📁 search/           # User search
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📁 sync/             # User synchronization
│   │   │   │       └── 📄 route.ts
│   │   │   └── 📁 webhooks/             # Webhook handlers
│   │   │       └── 📁 clerk/            # Clerk webhooks
│   │   │           └── 📄 route.ts
│   │   ├── 📁 chat/                     # Chat page
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 debug/                    # Debug pages
│   │   │   └── 📁 sync/                 # Sync testing
│   │   │       ├── 📄 page.tsx
│   │   │       └── 📄 SyncTestPage.tsx
│   │   ├── 📁 sign-in/                  # Authentication pages
│   │   │   └── 📁 [[...sign-in]]/
│   │   │       └── 📄 page.tsx
│   │   ├── 📁 sign-up/                  # Registration pages
│   │   │   └── 📁 [[...sign-up]]/
│   │   │       └── 📄 page.tsx
│   │   ├── 📄 favicon.ico               # Site favicon
│   │   ├── 📄 globals.css               # Global styles
│   │   ├── 📄 layout.tsx                # Root layout
│   │   └── 📄 page.tsx                  # Home page
│   ├── 📁 components/                   # React components
│   │   ├── 📁 auth/                     # Authentication components
│   │   │   └── 📄 SignOutButton.tsx     # Sign out functionality
│   │   ├── 📁 chat/                     # Chat components
│   │   │   ├── 📄 ChatApp.tsx           # Main chat application
│   │   │   ├── 📄 ChatPage.tsx          # Chat page wrapper
│   │   │   ├── 📄 ChatWindow.tsx        # Chat window component
│   │   │   ├── 📄 ContactsPanel.tsx     # Contacts management
│   │   │   ├── 📄 ConversationList.tsx  # Conversation listing
│   │   │   ├── 📄 MessageBubble.tsx     # Individual message display
│   │   │   ├── 📄 MessageInput.tsx      # Message input component
│   │   │   ├── 📄 MessageSearch.tsx     # Message search
│   │   │   ├── 📄 Sidebar.tsx           # Chat sidebar
│   │   │   ├── 📄 TypingIndicator.tsx   # Typing status
│   │   │   ├── 📄 UserPresence.tsx      # Online status
│   │   │   ├── 📄 UserProfile.tsx       # User profile display
│   │   │   └── 📄 VoiceMessage.tsx      # Voice message player
│   │   ├── 📁 Landing/                  # Landing page components
│   │   │   └── 📄 LandingPage.tsx       # Landing page
│   │   └── 📁 ui/                       # UI components (Radix UI)
│   │       ├── 📄 avatar.tsx            # Avatar component
│   │       ├── 📄 badge.tsx             # Badge component
│   │       ├── 📄 button.tsx            # Button component
│   │       ├── 📄 card.tsx              # Card component
│   │       ├── 📄 context-menu.tsx      # Context menu
│   │       ├── 📄 dialog.tsx            # Dialog component
│   │       ├── 📄 dropdown-menu.tsx     # Dropdown menu
│   │       ├── 📄 input.tsx             # Input component
│   │       ├── 📄 label.tsx             # Label component
│   │       ├── 📄 scroll-area.tsx       # Scroll area
│   │       ├── 📄 separator.tsx         # Separator component
│   │       ├── 📄 sheet.tsx             # Sheet component
│   │       ├── 📄 sonner.tsx            # Toast notifications
│   │       ├── 📄 tabs.tsx              # Tabs component
│   │       ├── 📄 textarea.tsx          # Textarea component
│   │       └── 📄 ThemeToggle.tsx       # Theme switcher
│   ├── 📁 contexts/                     # React contexts
│   │   └── 📄 ThemeContext.tsx          # Theme management
│   ├── 📁 hooks/                        # Custom React hooks
│   │   ├── 📄 useSocket.ts              # Socket.io hook
│   │   └── 📄 useUserSync.ts            # User synchronization
│   ├── 📁 lib/                          # Utility libraries
│   │   ├── 📄 prisma.ts                 # Prisma client
│   │   ├── 📄 uploadthing.ts            # File upload utilities
│   │   └── 📄 utils.ts                  # General utilities
│   ├── 📁 types/                        # TypeScript type definitions
│   │   └── 📄 chat.ts                   # Chat-related types
│   └── 📄 middleware.ts                 # Next.js middleware
├── 📁 prisma/                           # Database schema
│   └── 📄 schema.prisma                 # Prisma schema definition
├── 📁 public/                           # Static assets
│   ├── 📁 uploads/                      # File uploads directory
│   │   └── 📁 voice/                    # Voice message storage
│   ├── 📄 file.svg                      # File icon
│   ├── 📄 globe.svg                     # Globe icon
│   ├── 📄 next.svg                      # Next.js logo
│   ├── 📄 vercel.svg                    # Vercel logo
│   └── 📄 window.svg                    # Window icon
├── 📄 .env.local                        # Environment variables
├── 📄 components.json                   # Component configuration
├── 📄 eslint.config.mjs                 # ESLint configuration
├── 📄 next.config.ts                    # Next.js configuration
├── 📄 package.json                      # Dependencies and scripts
├── 📄 postcss.config.mjs                # PostCSS configuration
├── 📄 server.js                         # Custom server setup
├── 📄 tsconfig.json                     # TypeScript configuration
└── 📄 README.md                         # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **MySQL** database
- **Clerk** account for authentication

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/whatsapp-clone-full.git
   cd whatsapp-clone-full
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

   # Clerk URLs
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/chat
   NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/chat

   # Database
   DATABASE_URL="mysql://username:password@localhost:3306/whatsapp_clone"

   # Socket.io
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Application
   NODE_ENV=development
   NEXT_PUBLIC_ENCRYPTION_KEY=your_encryption_key
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Schema

The application uses Prisma ORM with MySQL. Key models include:

### User Model
```prisma
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  name      String
  imageUrl  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  messages        Message[]
  conversations   Conversation[]
  sentMessages    Message[] @relation("MessageSender")
}
```

### Conversation Model
```prisma
model Conversation {
  id        String   @id @default(cuid())
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  messages Message[]
  users    User[]
}
```

### Message Model
```prisma
model Message {
  id             String      @id @default(cuid())
  content        String
  type           MessageType @default(TEXT)
  fileUrl        String?
  fileName       String?
  fileSize       Int?
  isDelivered    Boolean     @default(false)
  isRead         Boolean     @default(false)
  readAt         DateTime?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  
  // Relations
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  conversationId String
  sender         User         @relation("MessageSender", fields: [senderId], references: [id])
  senderId       String
  replyTo        Message?     @relation("MessageReply", fields: [replyToId], references: [id])
  replyToId      String?
  replies        Message[]    @relation("MessageReply")
}
```

## 🔧 API Endpoints

### Authentication
- `POST /api/webhooks/clerk` - Clerk webhook handler

### Users
- `GET /api/users/search` - Search users
- `POST /api/users/sync` - Sync user data

### Conversations
- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Create conversation
- `GET /api/conversations/[id]` - Get conversation
- `PUT /api/conversations/[id]` - Update conversation
- `DELETE /api/conversations/[id]` - Delete conversation
- `GET /api/conversations/[id]/search` - Search messages

### Messages
- `GET /api/conversations/[id]/messages` - List messages
- `POST /api/conversations/[id]/messages` - Send message
- `PUT /api/conversations/[id]/messages/[messageId]` - Update message
- `DELETE /api/conversations/[id]/messages/[messageId]` - Delete message
- `PUT /api/conversations/[id]/messages/[messageId]/status` - Update message status

### Voice Messages
- `POST /api/conversations/[id]/voice` - Upload voice message

### File Uploads
- `POST /api/upload` - Upload files (images, documents)

## 🎨 UI Components

### Chat Components
- **ChatApp** - Main chat application wrapper
- **ChatPage** - Chat page with sidebar and main area
- **ChatWindow** - Main chat window with messages
- **MessageBubble** - Individual message display
- **MessageInput** - Message input with file upload
- **VoiceMessage** - Voice message player with controls
- **Sidebar** - Chat sidebar with conversations
- **ContactsPanel** - User contacts management

### UI Components (Radix UI)
- **Button** - Customizable button component
- **Input** - Form input component
- **Dialog** - Modal dialog component
- **Dropdown** - Dropdown menu component
- **Avatar** - User avatar component
- **Badge** - Status badge component
- **Card** - Content card component
- **Tabs** - Tab navigation component

## 🔌 Real-Time Features

### Socket.io Events
- `message:send` - Send new message
- `message:delivered` - Message delivery confirmation
- `message:read` - Message read confirmation
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `user:online` - User online status
- `user:offline` - User offline status

### Real-Time Updates
- **Instant Messaging** - Messages appear immediately
- **Typing Indicators** - Real-time typing status
- **Online Status** - Live user presence
- **Message Status** - Delivery and read receipts
- **Voice Messages** - Real-time audio playback

## 📱 File Management

### Supported File Types
- **Images**: JPG, PNG, GIF, WebP
- **Documents**: PDF, DOC, DOCX, TXT
- **Audio**: WebM (voice messages)

### File Storage
- **Local Storage** - Files stored in `public/uploads/`
- **Voice Messages** - Stored in `public/uploads/voice/`
- **File Validation** - Size and type checking
- **Unique Naming** - Timestamp-based file names

## 🎵 Voice Messaging Features

### Recording
- **Browser-based Recording** - Uses MediaRecorder API
- **WebM Format** - Optimized for web playback
- **Duration Tracking** - Real-time recording duration
- **Visual Feedback** - Recording status indicators

### Playback
- **Custom Audio Player** - Full-featured controls
- **Progress Bar** - Seekable timeline
- **Play/Pause** - Standard audio controls
- **Duration Display** - Accurate time display
- **Error Handling** - Graceful fallbacks

## 🔐 Security Features

### Authentication
- **Clerk Integration** - Professional auth service
- **Protected Routes** - Middleware-based protection
- **Session Management** - Secure session handling
- **Webhook Validation** - Secure webhook processing

### File Security
- **File Type Validation** - MIME type checking
- **Size Limits** - 4MB file size restriction
- **Path Validation** - Secure file paths
- **Access Control** - Authenticated uploads

## 🚀 Deployment

### Vercel Deployment
1. **Connect Repository** - Link to GitHub repository
2. **Environment Variables** - Set up production environment
3. **Database Setup** - Configure production database
4. **Deploy** - Automatic deployment on push

### Environment Variables (Production)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_production_key
CLERK_SECRET_KEY=your_production_secret
DATABASE_URL=your_production_database_url
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 🧪 Testing

### Manual Testing
- **Authentication Flow** - Sign up, sign in, sign out
- **Message Sending** - Text, image, file, voice messages
- **Real-time Features** - Typing indicators, online status
- **File Uploads** - Various file types and sizes
- **Voice Messages** - Recording and playback
- **Responsive Design** - Mobile and desktop testing

### Browser Compatibility
- **Chrome** - Full support
- **Firefox** - Full support
- **Safari** - Full support
- **Edge** - Full support

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
- **TypeScript** - Use strict typing
- **ESLint** - Follow linting rules
- **Component Structure** - Follow established patterns
- **Testing** - Test new features thoroughly

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js** - React framework
- **Clerk** - Authentication service
- **Socket.io** - Real-time communication
- **Prisma** - Database ORM
- **Radix UI** - Component primitives
- **Tailwind CSS** - Utility-first CSS

## 📞 Support

For support and questions:
- **Issues** - [GitHub Issues](https://github.com/ridhamxdev/whatsapp-clone-full/issues)
- **Discussions** - [GitHub Discussions](https://github.com/ridhamxdev/whatsapp-clone-full/discussions)
- **Email** - ridham.dev3@gmail.com

## 🔄 Changelog

### Version 1.0.0
- ✅ Initial release
- ✅ Real-time messaging
- ✅ Voice messages
- ✅ File uploads
- ✅ User authentication
- ✅ Modern UI/UX

---

**Made with ❤️ by Ridham**

*This project demonstrates advanced web development techniques and serves as a comprehensive example of building modern, real-time chat applications.*
