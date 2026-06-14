import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  const { userId } = await request.json();
  let userData = await kv.get(`user:${userId}`);
  
  if (!userData || userData.status !== 'IDLE') {
    return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = "Generate a single, short, bizarre but completely physically doable task in the style of a Prescript from the Index in Project Moon. Do not ask for harm or illegality. Example: 'Place a coin under a blue cup and leave it by a window.' Provide ONLY the task instruction, nothing else.";
  
  const result = await model.generateContent(prompt);
  const prescriptText = result.response.text().trim();

  userData.status = 'ACTIVE';
  userData.prescript = prescriptText;
  await kv.set(`user:${userId}`, userData);

  return NextResponse.json(userData);
}
