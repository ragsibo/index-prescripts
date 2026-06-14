import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get('file');
  const userId = formData.get('userId');

  if (!file || !userId) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

  let userData = await kv.get(`user:${userId}`);
  
  const baseUrl = request.nextUrl.origin;
  const approveLink = `${baseUrl}/api/approve?userId=${userId}`;
  const disapproveLink = `${baseUrl}/api/disapprove?userId=${userId}`;

  const discordFormData = new FormData();
  discordFormData.append('file', file);
  
  const payload = {
    embeds: [{
      title: `Proof submitted by ${userId}`,
      description: `**Prescript:** ${userData.prescript}\n\n**Action Required:**\n[✅ APPROVE PRESCRIPT](${approveLink})  |  [❌ DISAPPROVE PRESCRIPT](${disapproveLink})`,
      color: 0xffffff
    }]
  };
  
  discordFormData.append('payload_json', JSON.stringify(payload));

  const discordRes = await fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: 'POST', body: discordFormData
  });

  if (!discordRes.ok) return NextResponse.json({ error: 'Failed Discord link' }, { status: 500 });

  userData.status = 'PENDING';
  await kv.set(`user:${userId}`, userData);

  return NextResponse.json(userData);
}
