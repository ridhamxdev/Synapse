import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'WhatsApp Clone',
  description: 'A real-time messaging app built with Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-gray-100 dark:bg-gray-900">
          {children}
          <Toaster richColors />
        </body>
      </html>
    </ClerkProvider>
  )
}
