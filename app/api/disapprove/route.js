import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  let userData = await kv.get(`user:${userId}`);
  if (!userData || userData.status !== 'PENDING') return new NextResponse('Already processed.');

  userData.status = 'LOCKED';
  userData.lockedUntil = Date.now() + (24 * 60 * 60 * 1000); // 24 Hours
  userData.prescript = null;
  await kv.set(`user:${userId}`, userData);

  return new NextResponse(`<html><body style="background:#111;color:#fff;text-align:center;padding:50px;font-family:sans-serif;"><h1>Will Executed.</h1><p>${userId} has been DISAPPROVED and locked out for 24 hours.</p></body></html>`, { headers: { 'Content-Type': 'text/html' } });
}
