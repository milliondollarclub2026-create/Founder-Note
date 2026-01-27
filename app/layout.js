import './globals.css'
import { Toaster } from 'sonner'

export const metadata = {
  title: 'FounderNotes - AI Voice Notes for Founders',
  description: 'Capture ideas with voice, get AI-powered transcription and insights automatically.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        {children}
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            style: {
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--foreground))',
            },
          }}
        />
      </body>
    </html>
  )
}
