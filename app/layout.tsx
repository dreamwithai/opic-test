import React from 'react'
import './globals.css'
import type { Metadata } from 'next'
import LoginInfoHeader from './components/LoginInfoHeader'

export const metadata: Metadata = {
  title: 'OPIc 모의테스트',
  description: 'OPIc 영어 말하기 모의테스트 - 실전과 같은 환경에서 연습하세요',
  keywords: ['OPIc', '영어 말하기', '모의테스트', '영어 시험', '영어 회화'],
  authors: [{ name: 'OPIc Team' }],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  colorScheme: 'light',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>
        <LoginInfoHeader />
        {children}
      </body>
    </html>
  )
} 