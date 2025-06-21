import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">페이지를 찾을 수 없습니다.</h2>
        <p className="text-gray-600 mb-6">
          죄송합니다. 요청하신 페이지가 존재하지 않거나, 이름이 변경되었거나, 일시적으로 사용할 수 없습니다.
        </p>
        <Link
          href="/"
          className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-md hover:bg-blue-700 transition-colors duration-300"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
} 