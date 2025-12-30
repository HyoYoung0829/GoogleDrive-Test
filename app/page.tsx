'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 제공해주신 클라이언트 ID입니다.
  const GOOGLE_CLIENT_ID = '1096735541122-g6hgmt77aru51dts1llqta5q272d527b.apps.googleusercontent.com';
  const REDIRECT_URI = 'http://localhost:3000/auth/callback';

  const handleLogin = () => {
    // URLSearchParams를 사용하면 특수문자나 공백 처리가 자동으로 되어 안전합니다.
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/drive.file', // 중요: 이 앱이 만든 파일만 접근
      access_type: 'offline', // 리프레시 토큰 발급용
      prompt: 'consent',      // 항상 동의 화면 띄우기 (리프레시 토큰 확실히 받기 위해)
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    
    // 팝업 띄우기
    window.open(url, 'google_login_popup', 'width=500,height=600');
  };

  // 팝업에서 보내온 메시지(인증 코드) 수신
  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      // 보안 확인: 메시지가 우리 사이트(localhost:3000)에서 온 게 맞는지 체크
      if (e.origin !== window.location.origin) return;

      // 팝업이 닫히면서 보낸 code가 있는지 확인
      if (e.data?.code) {
        console.log('인증 코드 확인:', e.data.code);

        try {
          // BFF(Next.js API)로 코드 전송 -> 토큰 교환 요청
          const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: e.data.code }),
          });

          if (res.ok) {
            alert('로그인 성공! 쿠키가 생성되었습니다.');
            setIsLoggedIn(true);
          } else {
            const errorData = await res.json();
            console.error('토큰 교환 실패:', errorData);
            alert('로그인 처리 중 오류가 발생했습니다.');
          }
        } catch (error) {
          console.error('API 요청 에러:', error);
          alert('서버와 통신 중 에러가 발생했습니다.');
        }
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('message', handleMessage);
    
    // 컴포넌트가 사라질 때 리스너 제거 (Clean-up)
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 폴더 생성 테스트 함수
  const createTestFolder = async () => {
    try {
      const res = await fetch('/api/drive/create-folder', { method: 'POST' });
      const data = await res.json();
      
      if (data.fileId) {
        alert(`성공! 드라이브를 확인하세요.\n폴더명: ${data.name}\nID: ${data.fileId}`);
      } else {
        alert('실패: ' + JSON.stringify(data));
      }
    } catch (error) {
      console.error('폴더 생성 에러:', error);
      alert('폴더 생성 요청 중 에러가 발생했습니다.');
    }
  };

  return (
    <div style={{ padding: 50, display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'flex-start' }}>
      <h1>모바일 청첩장: 구글 드라이브 연동 테스트</h1>
      
      {!isLoggedIn ? (
        <button 
          onClick={handleLogin} 
          style={{ 
            padding: '12px 24px', 
            fontSize: '16px', 
            cursor: 'pointer',
            backgroundColor: '#4285F4',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          구글 드라이브 연결하기
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ color: 'green', fontWeight: 'bold' }}>✅ 인증 완료 (쿠키 저장됨)</p>
          <button 
            onClick={createTestFolder} 
            style={{ 
              padding: '12px 24px', 
              fontSize: '16px', 
              cursor: 'pointer', 
              background: '#0F9D58', 
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            내 드라이브에 청첩장_테스트 폴더 만들기
          </button>
        </div>
      )}
    </div>
  );
}