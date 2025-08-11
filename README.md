# Synapse - Next Generation Messaging Platform

A modern, feature-rich messaging platform built with Next.js, TypeScript, and real-time messaging capabilities. Synapse combines the power of WhatsApp-style communication with cutting-edge UI/UX design inspired by Aceternity UI.

![Synapse](https://img.shields.io/badge/Synapse-Next%20Generation%20Messaging-blue?style=for-the-badge&logo=message-circle)
![Next.js](https://img.shields.io/badge/Next.js-15.4.3-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![React](https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react)
![Socket.io](https://img.shields.io/badge/Socket.io-4.8.1-black?style=for-the-badge&logo=socket.io)
![Prisma](https://img.shields.io/badge/Prisma-6.12.0-black?style=for-the-badge&logo=prisma)
![Clerk](https://img.shields.io/badge/Clerk-Auth-blue?style=for-the-badge&logo=clerk)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-Animation-green?style=for-the-badge&logo=framer)

## 🚀 Live Demo

[View Live Demo](https://your-demo-link.com) *(Coming Soon)*

## ✨ Features

### 🎨 **Synapse Branding & Design**
- **Professional Landing Page** - Interactive Synapse branding with hover effects
- **WhatsApp-Style Colors** - Official green gradient (#25D366, #128C7E, #075E54)
- **Aceternity UI Inspiration** - Modern glassmorphism and gradient effects
- **Interactive Animations** - Mouse-following effects and smooth transitions
- **Responsive Design** - Mobile-first approach with modern aesthetics

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
- **Enhanced Message Bubbles** - Configurable styling for sender/receiver messages
- **Group Chat Support** - Create and manage group conversations
- **Group Management** - Add/remove members, assign admins, edit group info
- **Group Permissions** - Role-based access control (Admin/Member)
- **Group Info Panel** - View members, edit group details, leave group

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

### 🎨 Modern UI/UX with Aceternity UI
- **Glassmorphism Effects** - Modern glass-like components
- **Gradient Animations** - Smooth gradient transitions
- **Hover Effects** - Interactive element animations
- **Floating Elements** - Animated background particles
- **Sparkles & Spotlight** - Aceternity UI-inspired effects
- **Tracing Beam** - Animated content reveals
- **Responsive Design** - Mobile-first responsive layout
- **Dark/Light Theme** - Theme switching capability
- **Modern Components** - Enhanced Radix UI component library
- **Smooth Animations** - Framer Motion-powered animations
- **Loading States** - Elegant loading indicators
- **Error Handling** - User-friendly error messages
- **Group Creation Modal** - Beautiful modal for creating new groups
- **Member Selection** - Search and select users to add to groups
- **Group Avatars** - Custom group images and fallback icons

### 🔧 Technical Features
- **TypeScript** - Full type safety
- **Real-time Communication** - Socket.io integration
- **Database Integration** - Prisma ORM with MySQL
- **API Routes** - RESTful API endpoints
- **Middleware** - Route protection and validation
- **Environment Management** - Secure configuration
- **Framer Motion** - Advanced animations and interactions

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.4.3** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5.0** - Type safety
- **Tailwind CSS 4** - Utility-first CSS framework
- **Framer Motion** - Animation library
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
synapse/
├── 📁 src/
│   ├── 📁 app/                          # Next.js App Router
│   │   ├── 📁 (main)/                   # Main layout group
│   │   │   └── 📄 page.tsx              # Synapse landing page
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
│   │   │   ├── 📁 upload/               # File upload endpoint
│   │   │   │   └── 📄 route.ts          # Local file storage
│   │   │   ├── 📁 users/                # User management
│   │   │   │   ├── 📁 search/           # User search
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 profile/          # User profile management
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📁 sync/             # User synchronization
│   │   │   │       └── 📄 route.ts
│   │   │   └── 📁 webhooks/             # Webhook handlers
│   │   │       └── 📁 clerk/            # Clerk webhooks
│   │   │           └── 📄 route.ts
│   │   ├── 📁 chat/                     # Chat page
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 sign-in/                  # Authentication pages
│   │   │   └── 📁 [[...sign-in]]/
│   │   │       └── 📄 page.tsx
│   │   ├── 📁 sign-up/                  # Registration pages
│   │   │   └── 📁 [[...sign-up]]/
│   │   │       └── 📄 page.tsx
│   │   ├── 📄 favicon.ico               # Site favicon
│   │   ├── 📄 globals.css               # Global styles with Aceternity UI
│   │   ├── 📄 layout.tsx                # Root layout
│   │   └── 📄 page.tsx                  # Synapse landing page
│   ├── 📁 components/                   # React components
│   │   ├── 📁 auth/                     # Authentication components
│   │   │   └── 📄 SignOutButton.tsx     # Sign out functionality
│   │   ├── 📁 chat/                     # Chat components
│   │   │   ├── 📄 ChatApp.tsx           # Main chat application
│   │   │   ├── 📄 ChatPage.tsx          # Chat page wrapper
│   │   │   ├── 📄 ChatWindow.tsx        # Chat window + call buttons
│   │   │   ├── 📄 ContactsPanel.tsx     # Contacts management
│   │   │   ├── 📄 ConversationList.tsx  # Conversation listing
│   │   │   ├── 📄 MessageBubble.tsx     # Enhanced message display
│   │   │   ├── 📄 MessageInput.tsx      # Message input component
│   │   │   ├── 📄 MessageSearch.tsx     # Message search
│   │   │   ├── 📄 Sidebar.tsx           # Chat sidebar with glassmorphism
│   │   │   ├── 📄 TypingIndicator.tsx   # Typing status
│   │   │   ├── 📄 UserPresence.tsx      # Online status
│   │   │   ├── 📄 UserProfile.tsx       # User profile display
│   │   │   └── 📄 VoiceMessage.tsx      # Voice message player
│   │   ├── 📁 Landing/                  # Landing page components
│   │   │   └── 📄 SynapseLandingPage.tsx # Enhanced Synapse landing page
│   │   └── 📁 ui/                       # UI components (Enhanced)
│   │       ├── 📄 animated-background.tsx # Animated background effects
│   │       ├── 📄 avatar.tsx            # Avatar component
│   │       ├── 📄 badge.tsx             # Badge component
│   │       ├── 📄 button.tsx            # Enhanced button with variants
│   │       ├── 📄 card.tsx              # Card component
│   │       ├── 📄 context-menu.tsx      # Context menu
│   │       ├── 📄 dialog.tsx            # Dialog component
│   │       ├── 📄 dropdown-menu.tsx     # Dropdown menu
│   │       ├── 📄 floating-action-button.tsx # Floating action buttons
│   │       ├── 📄 gradient-card.tsx     # Gradient card components
│   │       ├── 📄 input.tsx             # Input component
│   │       ├── 📄 label.tsx             # Label component
│   │       ├── 📄 scroll-area.tsx       # Scroll area
│   │       ├── 📄 separator.tsx         # Separator component
│   │       ├── 📄 sheet.tsx             # Sheet component
│   │       ├── 📄 sonner.tsx            # Toast notifications
│   │       ├── 📄 sparkles.tsx          # Sparkles animation component
│   │       ├── 📄 spotlight.tsx         # Spotlight effect component
│   │       ├── 📄 synapse-banner.tsx    # Synapse branding component
│   │       ├── 📄 tabs.tsx              # Tabs component
│   │       ├── 📄 textarea.tsx          # Textarea component
│   │   ├── 📁 call/                     # WebRTC call components
│   │   │   └── 📄 CallModal.tsx         # Local/remote video, call controls, screenshare
│   │       ├── 📄 ThemeToggle.tsx       # Theme switcher
│   │       └── 📄 tracing-beam.tsx      # Tracing beam animation
│   ├── 📁 contexts/                     # React contexts
│   │   ├── 📄 ProfileContext.tsx        # Profile management
│   │   └── 📄 ThemeContext.tsx          # Theme management
│   ├── 📁 hooks/                        # Custom React hooks
│   │   ├── 📄 useSocket.ts              # Socket.io hook
│   │   └── 📄 useUserSync.ts            # User synchronization
│   ├── 📁 lib/                          # Utility libraries
│   │   ├── 📄 prisma.ts                 # Prisma client
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
├── 📄 tailwind.config.ts                # Tailwind configuration with animations
├── 📄 tsconfig.json                     # TypeScript configuration
└── 📄 README.md                         # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **MySQL** database
- **Clerk** account for authentication

## 👥 Group Chat Features

### Creating Groups
1. Navigate to the **Contacts** tab in the sidebar
2. Click the **"New Group"** button
3. Enter a group name and optional image URL
4. Search and select members to add
5. Click **"Create Group"** to finalize

### Group Management
- **Edit Group Info**: Click on group avatar/name to open group info panel
- **Add Members**: Use the "Add Member" button in group info
- **Leave Group**: Available in group info panel (admins can't leave if they're the only admin)
- **Role Management**: Admins can edit group details and manage members

### Group Chat Experience
- **Group Messages**: All group members receive real-time messages
- **Member List**: View all group participants with their roles
- **Group Avatars**: Custom images or default group icon
- **Admin Controls**: Only admins can modify group settings

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ridhamxdev/whatsapp-clone-full.git
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
   DATABASE_URL="mysql://username:password@localhost:3306/synapse_messaging"

   # Socket.io
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   
   # Groq (free-tier; recommended)
   AI_PROVIDER=groq
   GROQ_API_KEY=your_groq_key
   GROQ_MODEL=llama3-8b-8192

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

## 🎨 UI/UX Enhancements

### Aceternity UI Components
- **Animated Background** - Dynamic background effects with multiple variants
- **Gradient Cards** - Glassmorphism cards with gradient borders
- **Floating Action Buttons** - Interactive floating buttons
- **Sparkles** - Animated sparkle effects
- **Spotlight** - Mouse-following spotlight effects
- **Tracing Beam** - Animated content reveals
- **Synapse Banner** - Interactive branding component

### Enhanced Styling
- **Glassmorphism Effects** - Modern glass-like components
- **Gradient Animations** - Smooth gradient transitions
- **Hover Effects** - Interactive element animations
- **Floating Elements** - Animated background particles
- **Custom Animations** - Framer Motion-powered interactions
- **Responsive Design** - Mobile-first approach

### Message Bubble Improvements
- **Configurable Styling** - Separate styles for sender/receiver messages
- **Better Text Fitting** - Optimized text alignment and spacing
- **Enhanced Timestamps** - Improved timestamp positioning
- **WhatsApp-Style Colors** - Professional green gradient scheme
- **Smooth Animations** - Message appearance animations

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
- `GET /api/users/profile` - Get user profile

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
- **ChatWindow** - Main chat window with spotlight effects
- **MessageBubble** - Enhanced message display with configurable styling
- **MessageInput** - Message input with file upload
- **VoiceMessage** - Voice message player with controls
- **Sidebar** - Chat sidebar with glassmorphism effects
- **ContactsPanel** - User contacts management

### Enhanced UI Components
- **AnimatedBackground** - Dynamic background effects
- **GradientCard** - Glassmorphism cards with gradients
- **FloatingActionButton** - Interactive floating buttons
- **Sparkles** - Animated sparkle effects
- **Spotlight** - Mouse-following spotlight effects
- **TracingBeam** - Animated content reveals
- **SynapseBanner** - Interactive branding component

### UI Components (Radix UI Enhanced)
- **Button** - Enhanced button with multiple variants (gradient, glass, neon, floating)
- **Input** - Form input component
- **Dialog** - Modal dialog component
- **Dropdown** - Dropdown menu component
- **Avatar** - User avatar component
- **Badge** - Status badge component
- **Card** - Enhanced card component
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
- **UI Animations** - All Aceternity UI effects and interactions

### Browser Compatibility
- **Chrome/Edge** - Full support (best for screen/tab audio sharing)
- **Firefox** - Good support (tab audio capture may differ)
- **Safari** - WebRTC supported; background behavior and tab audio share may be limited
- **Edge** - Full support

## 🎥 WebRTC Calls & Screenshare (Local Network)

Synapse includes LAN-only audio/video calls and screen sharing using the built-in Socket.IO signaling in `server.js`. No paid services or external TURN are required for same Wi‑Fi/LAN.

### Features
- Two video panes (local and remote)
- Start Camera/Mic, Call, End controls
- Toggle Screen Share with optional system/tab audio
- Audio-first capture (echoCancellation, noiseSuppression, autoGainControl)
- Wake Lock to reduce throttling when minimized

### How to use
1. Open the same conversation in two tabs/devices on the same Wi‑Fi.
2. Click Video (or Phone for audio-only) in the chat header.
3. Click “Start Camera” (or “Start Mic”), then “Call”.
4. On the second device/tab, open the modal and start the camera/mic; it will connect automatically.
5. Click “Toggle Screen Share” to share the screen. Use “Screen Audio: On” to include tab/system audio when supported by the browser.

### Background behavior
- WebRTC streams generally continue in the background; UI rendering pauses.
- Selecting “Entire screen” or a different app/window for sharing is more reliable than sharing the minimized tab itself.
- A wake lock is requested during a call to reduce throttling; released on end.

### Notes
- Uses public STUN only; for WAN or symmetric NAT you’d need a TURN server (not included).
- For multi-device LAN testing, open `http://YOUR_LAN_IP:3000` on both devices.

## 🤖 AI Assistant

The AI assistant supports either OpenAI or the free-tier Groq provider. Backend routes:
- `POST /api/ai/assist` – rewrite and response variants with optional conversation context
- `POST /api/ai/reply` – smart quick replies for a thread

Default provider selection:
- Set `AI_PROVIDER=groq` plus `GROQ_API_KEY` (recommended).

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
- **UI/UX** - Maintain Aceternity UI design principles

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js** - React framework
- **Clerk** - Authentication service
- **Socket.io** - Real-time communication
- **Prisma** - Database ORM
- **Radix UI** - Component primitives
- **Tailwind CSS** - Utility-first CSS
- **Framer Motion** - Animation library
- **Aceternity UI** - Design inspiration and components

## 📞 Support

For support and questions:
- **Issues** - [GitHub Issues](https://github.com/ridhamxdev/whatsapp-clone-full/issues)
- **Discussions** - [GitHub Discussions](https://github.com/ridhamxdev/whatsapp-clone-full/discussions)
- **Email** - ridham.dev3@gmail.com

## 🔄 Changelog

### Version 2.0.0 - Synapse Release
- ✅ **Synapse Branding** - Complete rebrand with professional landing page
- ✅ **Aceternity UI Integration** - Modern glassmorphism and gradient effects
- ✅ **Enhanced Message Bubbles** - Configurable sender/receiver styling
- ✅ **Interactive Animations** - Framer Motion-powered interactions
- ✅ **WhatsApp-Style Colors** - Professional green gradient scheme
- ✅ **Improved Landing Page** - Comprehensive Synapse landing page
- ✅ **Floating Action Buttons** - Interactive floating UI elements
- ✅ **Spotlight Effects** - Mouse-following spotlight animations
- ✅ **Sparkles & Tracing Beam** - Aceternity UI-inspired effects
- ✅ **Enhanced Navigation** - Professional navigation with Synapse branding
- ✅ **Code Cleanup** - Removed debug folders and demo pages
- ✅ **Optimized Structure** - Streamlined project organization

### Version 1.0.0 - Initial Release
- ✅ Real-time messaging
- ✅ Voice messages
- ✅ File uploads
- ✅ User authentication
- ✅ Modern UI/UX

---

**Made with ❤️ by Ridham**

*Synapse represents the future of messaging - combining cutting-edge technology with beautiful design to create an unparalleled communication experience.*

*This project demonstrates advanced web development techniques and serves as a comprehensive example of building modern, real-time chat applications with professional branding and enhanced user experience.*
