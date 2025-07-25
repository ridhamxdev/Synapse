import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { LandingPage } from '@/components/Landing/LandingPage'

export default async function HomePage() {
  const user = await currentUser()
  if (user) {
    redirect('/chat')
  }
  return <LandingPage />
}
