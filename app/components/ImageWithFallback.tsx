import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

export default function ImageWithFallback(props: ImageProps & { fallbackSrc?: string }) {
  const [error, setError] = useState<null | string>(null);
  const { fallbackSrc, ...imageProps } = props;

  if (error) {
    return (
      <div style={{ display: 'inline-block', position: 'relative' }}>
        <img
          src={fallbackSrc || '/default-profile.png'}
          alt={imageProps.alt as string}
          style={imageProps.style}
          className={imageProps.className}
        />
        <div style={{
          position: 'absolute', left: 0, bottom: 0, right: 0,
          background: 'rgba(255,0,0,0.1)', color: '#b91c1c', fontSize: 10, textAlign: 'center'
        }}>
          이미지 에러: {error}
        </div>
      </div>
    );
  }
  return (
    <Image
      {...imageProps}
      onError={e => {
        setError((e as any)?.nativeEvent?.message || '알 수 없는 오류');
        // 콘솔에도 남김
        console.error('이미지 로딩 실패:', imageProps.src);
      }}
    />
  );
} 