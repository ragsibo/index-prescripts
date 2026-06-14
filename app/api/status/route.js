import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  let userData = await kv.get(`user:${userId}`);
  
  if (!userData) {
    userData = { status: 'IDLE', rep: 0, prescript: null, lockedUntil: null };
    await kv.set(`user:${userId}`, userData);
  }

  // Check 24-hour lockout expiration
  if (userData.status === 'LOCKED' && userData.lockedUntil && Date.now() > userData.lockedUntil) {
    userData.status = 'IDLE';
    userData.lockedUntil = null;
    await kv.set(`user:${userId}`, userData);
  }

  return NextResponse.json(userData);
}
