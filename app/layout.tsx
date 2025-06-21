import './globals.css'
import type { Metadata } from 'next'
import LoginInfoHeader from './components/LoginInfoHeader'
import { Viewport } from 'next'
import AuthProvider from './components/AuthProvider'
import ScrollToTop from './components/ScrollToTop'

export const metadata: Metadata = {
  metadataBase: new URL('https://opic-test.vercel.app'),
  title: 'OPIc 모의테스트',
  description: 'OPIc 영어 말하기 모의테스트 - 실전과 같은 환경에서 연습하세요',
  keywords: ['OPIc', '영어 말하기', '모의테스트', '영어 시험', '영어 회화'],
  authors: [{ name: 'OPIc Team' }],
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'OPIc 모의테스트',
    description: 'OPIc 영어 말하기 모의테스트',
    type: 'website',
    locale: 'ko_KR',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb',
  colorScheme: 'light',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <ScrollToTop />
          <LoginInfoHeader />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
} 