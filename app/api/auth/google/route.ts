import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    // 1. 구글에 토큰 교환 요청
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: 'http://localhost:3000/auth/callback',
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error('구글 토큰 에러:', tokens);
      return NextResponse.json(tokens, { status: 400 });
    }

    // 2. 쿠키 굽기 (Next.js 15 대응: await cookies())
    const cookieStore = await cookies(); // ✨ 여기서 await 필수!
    
    cookieStore.set('drive_token', JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1주일
    });

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('BFF 에러:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}