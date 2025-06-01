/** @type {import('next').NextConfig} */
const nextConfig = {
  // React DevTools 경고 억제 (개발 환경)
  reactStrictMode: true,
  
  // 개발 서버 설정
  devIndicators: {
    buildActivity: false,
  },
  
  // 로그 레벨 설정
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  
  // 성능 최적화
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  
  // 정적 파일 처리
  async headers() {
    return [
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig 