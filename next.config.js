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
  
  // 정적 파일 접근 제한
  async rewrites() {
    return [
      // /data/ 경로 접근을 차단하고 404로 리다이렉트
      {
        source: '/data/:path*',
        destination: '/404',
      },
    ];
  },
  
  // 헤더 설정
  async headers() {
    return [
      {
        // API 라우트에 CORS 및 캐시 설정
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
      {
        // 정적 JSON 파일 접근 차단
        source: '/data/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig 