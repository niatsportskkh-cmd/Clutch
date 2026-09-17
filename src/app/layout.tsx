import type { Metadata, Viewport } from 'next'
import { Archivo, Geist, Geist_Mono } from 'next/font/google'
import SceneCanvas from '@/components/scene/SceneCanvas'
import { Nav } from '@/components/Nav'
import './globals.css'

const archivo = Archivo({ variable: '--font-archivo', subsets: ['latin'], axes: ['wdth'] })
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: 'Clutch: free esports matches', template: '%s | Clutch' },
  description: 'Free-entry esports matches. Pick a game, add your roster, claim a slot and get the room ID right here.',
}
export const viewport: Viewport = { themeColor: '#0b0b14', colorScheme: 'dark' }

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${archivo.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="flex min-h-[100dvh] flex-col">
        {/* mounted once, never remounted: navigation morphs the swarm instead of reloading it */}
        <SceneCanvas />
        <Nav />
        <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 pt-24 pb-24 sm:px-8 sm:pt-32">{children}</main>
        <footer className="mx-auto flex w-full max-w-[1320px] flex-wrap items-center justify-between gap-3 px-4 pb-10 text-sm text-muted sm:px-8">
          <p>Clutch. Free-entry esports matches.</p>
          <p>Entry is always free. No payments are taken on this site.</p>
        </footer>
      </body>
    </html>
  )
}
