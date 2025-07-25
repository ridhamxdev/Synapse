import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ChatApp } from '@/components/chat/ChatApp'

export default async function ChatPage() {
  const user = await currentUser()
  if (!user) {
    redirect('/')
  }
  return (
    <ErrorBoundary>
      <ChatApp />
    </ErrorBoundary>
  )
}
