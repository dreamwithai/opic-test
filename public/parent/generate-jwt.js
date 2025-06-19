// generate-jwt.js
const jwt = require('jsonwebtoken');
const fs = require('fs');

// 비밀키 로드 (루트에 위치)
const privateKey = fs.readFileSync('private.key');

// JWT 생성 (RS256)
const token = jwt.sign(
  { userId: 'ellie' },   // payload: 필요에 따라 변경
  privateKey,
  { algorithm: 'RS256', expiresIn: '1d' }
);

console.log(token); // 이 토큰을 test-parent.html에서 postMessage로 전달