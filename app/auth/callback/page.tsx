'use client';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function Callback() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  useEffect(() => {
    if (code && window.opener) {
      window.opener.postMessage({ code }, window.location.origin);
      window.close();
    }
  }, [code]);

  return <div>인증 중...</div>;
}