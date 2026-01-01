'use client';

import { useState, useEffect } from 'react';
// 방금 만든 컴포넌트 import (경로 확인해주세요)
import UploadButton from './components/UploadButton'; 

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [folderId, setFolderId] = useState<string | null>(null); // 폴더 ID 저장용 상태

  // 제공해주신 클라이언트 ID입니다.
  const GOOGLE_CLIENT_ID = '1096735541122-g6hgmt77aru51dts1llqta5q272d527b.apps.googleusercontent.com';
  const REDIRECT_URI = 'http://localhost:3000/auth/callback';

  const handleLogin = () => {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/drive.file', 
      access_type: 'offline', 
      prompt: 'consent',     
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    window.open(url, 'google_login_popup', 'width=500,height=600');
  };

  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;

      if (e.data?.code) {
        console.log('인증 코드 확인:', e.data.code);

        try {
          const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 폴더 생성 테스트 함수
  const createTestFolder = async () => {
    try {
      const res = await fetch('/api/drive/create-folder', { method: 'POST' });
      const data = await res.json();
      
      if (data.fileId) {
        alert(`성공! 폴더가 생성되었습니다.\n폴더명: ${data.name}\nID: ${data.fileId}`);
        // ★ 핵심: 생성된 폴더 ID를 상태에 저장 -> 업로드 버튼이 나타남
        setFolderId(data.fileId);
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
      
      {/* 1. 로그인 전 */}
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
        /* 2. 로그인 후 */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          <div style={{ padding: '10px', backgroundColor: '#e8f0fe', borderRadius: '4px' }}>
            <p style={{ color: 'green', fontWeight: 'bold', margin: 0 }}>✅ 인증 완료 (쿠키 저장됨)</p>
          </div>

          {/* 3. 폴더가 아직 없으면 생성 버튼 표시 */}
          {!folderId && (
            <button 
              onClick={createTestFolder} 
              style={{ 
                padding: '12px 24px', 
                fontSize: '16px', 
                cursor: 'pointer', 
                background: '#0F9D58', 
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                alignSelf: 'flex-start'
              }}
            >
              내 드라이브에 청첩장_테스트 폴더 만들기
            </button>
          )}

          {/* 4. 폴더가 생성되면 업로드 버튼 표시 */}
          {folderId && (
             <UploadButton folderId={folderId} />
          )}
        </div>
      )}
    </div>
  );
}