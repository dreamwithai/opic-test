import { jwtVerify } from 'jose';

// 브라우저에서 동작하므로, publicKey는 하드코딩 유지 (환경변수는 서버에서만 접근 가능)
const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmz5sVbxllxARrijrI3vO
T4z8TxuzCpxQx41CGESvtQIsp3ES+aRWqvCVWp0FTX8RgXCMkTY8pHRiJmM/OGRO
4EdweRAlIBQHEXnZSgMzumBnATtifyHduBHJXJQC9vrheu7atSVcQc9SIXhWQXQZ
H3zxuRqvv1B3m4437QbWhvmetpdWdf4Ctmv+WFLtV8+QQxe0i7P9Uhyy0yV6/EpU
M2MAhQcV5wkGmwanNg+p4c2DbTtLWB9zev+QQTewdXK1SKOJqwi5W7GALPG0XQxb
cPJhMTph5wd7XCtRLitK3KL5UCQgjCIFjN/VRJlPjPay5r8dQ+VRKczggqGK4LzM
awIDAQAB
-----END PUBLIC KEY-----`;

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer.buffer;
}

export async function verifyUserTokenBrowser(token: string): Promise<any> {
  try {
    const keyData = pemToArrayBuffer(publicKey);
    const key = await window.crypto.subtle.importKey(
      'spki',
      keyData,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch (err) {
    console.error('JWT verification failed:', err);
    return null;
  }
}