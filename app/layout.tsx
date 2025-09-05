import type { Metadata } from 'next'
import { AuthProvider } from '@/components/auth-provider'
import { NotesProvider } from '@/components/notes-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'PrepPal - Your Study Companion',
  description: 'Organize your studies and ace your exams with PrepPal',
  generator: 'PrepPal',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthProvider>
          <NotesProvider>
            {children}
          </NotesProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
