'use client';

import { useState } from 'react';

export default function UploadButton({ folderId }: { folderId: string }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // 파일이 선택되지 않았으면 중단
    if (!e.target.files?.[0]) return;
    
    setUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    
    // 파일과 폴더 ID를 묶어서 백엔드로 보냄
    formData.append('file', file);
    formData.append('folderId', folderId);

    try {
      const res = await fetch('/api/drive/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();

      if (res.ok) {
        alert(`업로드 성공!\n파일 ID: ${data.fileId}`);
        console.log('업로드 결과:', data);
      } else {
        console.error('업로드 실패:', data);
        alert('업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('서버 오류 발생');
    } finally {
      setUploading(false);
      // 같은 파일을 다시 올릴 수 있도록 input 값 초기화 (선택 사항)
      e.target.value = '';
    }
  };

  return (
    <div style={{ marginTop: '20px', padding: '20px', border: '2px dashed #ccc', borderRadius: '8px' }}>
      <h3>📷 사진 업로드 테스트</h3>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
        대상 폴더 ID: {folderId}
      </p>
      
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleUpload} 
        disabled={uploading}
      />
      
      {uploading && <p style={{ color: 'blue', fontWeight: 'bold' }}>열심히 업로드 중입니다... ⏳</p>}
    </div>
  );
}