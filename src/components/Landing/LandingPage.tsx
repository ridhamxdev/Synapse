import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  MessageCircle, 
  Users, 
  Shield, 
  Zap
} from 'lucide-react'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                WhatsApp Clone
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <SignInButton 
                mode="redirect"
                fallbackRedirectUrl="/chat"
              >
                <Button variant="ghost">Sign In</Button>
              </SignInButton>
              <SignUpButton 
                mode="redirect"
                fallbackRedirectUrl="/chat"
              >
                <Button>Get Started</Button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="bg-blue-600 p-4 rounded-full">
              <MessageCircle className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Connect with Anyone,{' '}
            <span className="text-blue-600">Anywhere</span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Experience seamless messaging with our modern WhatsApp clone. 
            Real-time conversations, file sharing, and more.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignUpButton 
              mode="redirect"
              fallbackRedirectUrl="/chat"
            >
              <Button size="lg" className="px-8 py-3 text-lg">
                Start Messaging
              </Button>
            </SignUpButton>
            <SignInButton 
              mode="redirect"
              fallbackRedirectUrl="/chat"
            >
              <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
                Sign In
              </Button>
            </SignInButton>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<MessageCircle className="h-8 w-8 text-blue-600" />}
            title="Real-time Messaging"
            description="Instant message delivery"
          />
          <FeatureCard
            icon={<Users className="h-8 w-8 text-green-600" />}
            title="Group Chats"
            description="Create group conversations"
          />
          <FeatureCard
            icon={<Shield className="h-8 w-8 text-purple-600" />}
            title="Secure & Private"
            description="Protected conversations"
          />
          <FeatureCard
            icon={<Zap className="h-8 w-8 text-yellow-600" />}
            title="Lightning Fast"
            description="Optimized performance"
          />
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode
  title: string
  description: string 
}) {
  return (
    <Card className="text-center">
      <CardHeader>
        <div className="flex justify-center mb-4">
          {icon}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  )
}
