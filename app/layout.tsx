import { AuthProvider } from '@/app/_components/auth-provider'
import { Navigation } from '@/app/_components/navigation'
import './globals.css'

export const metadata = {
  title: 'Azure Next Stack - Auth Demo',
  description: 'Testing authentication with protected products and customer records',
}

/**
 * Root Layout Component
 * Wraps the entire application with auth provider and navigation
 * Provides consistent layout structure across all pages
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="app-container">
            <Navigation />
            <main className="main-content">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
