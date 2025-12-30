import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  // 1. 쿠키에서 토큰 꺼내기 (Next.js 15 대응)
  const cookieStore = await cookies(); // ✨ 여기도 await 필수!
  const tokenCookie = cookieStore.get('drive_token');
  
  if (!tokenCookie) {
    return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
  }

  const tokens = JSON.parse(tokenCookie.value);
  const accessToken = tokens.access_token; 

  // 2. 구글 드라이브 API 호출 (폴더 생성)
  const driveRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: '청첩장_프로젝트_테스트', 
      mimeType: 'application/vnd.google-apps.folder', 
    }),
  });

  const fileData = await driveRes.json();
  
  if (!driveRes.ok) {
     return NextResponse.json(fileData, { status: driveRes.status });
  }
  
  return NextResponse.json({ fileId: fileData.id, name: fileData.name });
}