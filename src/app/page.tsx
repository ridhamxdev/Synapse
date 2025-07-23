import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { LandingPage } from '@/components/Landing/LandingPage'

export default async function HomePage() {
  const user = await currentUser()
  
  // If user is signed in, redirect to chat
  if (user) {
    redirect('/chat')
  }
  
  // If not signed in, show landing page
  return <LandingPage />
}
