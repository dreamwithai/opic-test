"use client";
import { useEffect, useRef } from "react";
import { useUserStore } from "./components/useUserStore";
import { usePathname } from "next/navigation";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { initFromStorage } = useUserStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Height 동기화 함수
  const sendHeight = () => {
    if (containerRef.current && window.parent !== window) {
      const height = containerRef.current.scrollHeight;
      window.parent.postMessage({ type: 'setHeight', height }, '*');
      // console.log('postMessage setHeight', height);
    }
  };

  // 부모에게 scrollToTop 요청
  const sendScrollToTop = () => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'scrollToTop' }, '*');
    }
  };

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  // 경로가 바뀔 때마다 height, scrollToTop 모두 전송
  useEffect(() => {
    setTimeout(sendHeight, 100);
    setTimeout(sendScrollToTop, 120);
  }, [pathname]);

  useEffect(() => {
    // 부모가 명시적으로 요청할 때만 응답
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'requestHeight') {
        sendHeight();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return <div ref={containerRef}>{children}</div>;
} 