import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/socket',
  '/api/webhook(.*)',
  '/api/upload(.*)'
  // '/api/uploadthing(.*)' // Commented out - using local upload instead
])

export default clerkMiddleware((auth, request) => {
  if (isPublicRoute(request)) {
    return
  }
  
  auth.protect()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
