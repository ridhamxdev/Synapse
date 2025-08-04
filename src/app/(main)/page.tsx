import dynamicImport from 'next/dynamic'

const ChatPage = dynamicImport(() => import('@/components/chat/ChatPage').then(mod => ({ default: mod.ChatPage })), { 
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )
})

export default function Page() {
  return <ChatPage />
}

export const dynamic = 'force-dynamic'
