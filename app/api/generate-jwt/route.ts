import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const PRIVATE_KEY = process.env.JWT_PRIVATE_KEY as string;

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }
  const token = jwt.sign(
    { userId },
    PRIVATE_KEY,
    { algorithm: 'RS256', expiresIn: '1d' }
  );
  return NextResponse.json({ token });
} 