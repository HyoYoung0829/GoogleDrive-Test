import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

export async function POST(req: NextRequest) {
  try {
    // 1. 프론트엔드에서 보낸 데이터 받기
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folderId') as string;

    if (!file || !folderId) {
      return NextResponse.json({ error: '파일 또는 폴더 ID가 없습니다.' }, { status: 400 });
    }

    // 2. 토큰 가져오기 (수정된 부분)
    // 쿠키 이름이 'drive_token'이고, 값이 JSON 문자열임이 확인되었습니다.
    const driveTokenCookie = req.cookies.get('drive_token')?.value;
    let accessToken = '';

    if (driveTokenCookie) {
      try {
        const tokenData = JSON.parse(driveTokenCookie); // JSON 문자열 파싱
        accessToken = tokenData.access_token;         // access_token 추출
      } catch (e) {
        console.error('토큰 파싱 에러:', e);
      }
    }

    if (!accessToken) {
      console.log('서버 수신 쿠키(디버깅):', req.cookies.getAll()); // 디버깅용
      return NextResponse.json({ error: '인증 토큰이 없습니다. 로그인을 다시 해주세요.' }, { status: 401 });
    }

    // 3. Google Drive 클라이언트 설정
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    auth.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: 'v3', auth });

    // 4. 파일 버퍼 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    // 5. 업로드 요청
    const response = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [folderId], 
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id, name, webViewLink',
    });

    console.log('✅ 업로드 성공:', response.data);

    return NextResponse.json({ 
      success: true, 
      fileId: response.data.id, 
      link: response.data.webViewLink 
    });

  } catch (error: any) {
    console.error('🔥 업로드 에러:', error);
    return NextResponse.json({ error: error.message || '업로드 중 에러 발생' }, { status: 500 });
  }
}