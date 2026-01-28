import './globals.css'
import { Instrument_Serif, DM_Sans } from 'next/font/google'
import { Toaster } from 'sonner'

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata = {
  title: 'Founder Note - AI Voice Notes for Founders',
  description: 'Capture ideas with voice, get AI-powered transcription and insights automatically.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${instrumentSerif.variable} ${dmSans.variable} min-h-screen bg-background antialiased`}>
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
