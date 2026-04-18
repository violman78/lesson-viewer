"use client";

import { useState, useEffect, ReactNode } from 'react';

export default function AdminAuth({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  // 브라우저 탭이 열려있는 동안에만 유효한 세션 확인
  useEffect(() => {
    const stored = sessionStorage.getItem('admin_authenticated');
    if (stored === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsVerifying(true);
    setError('');

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      if (res.ok) {
        // 브라우저 탭을 닫으면 자동 만료되는 세션 스토리지에 저장
        sessionStorage.setItem('admin_authenticated', 'true');
        setIsAuthenticated(true);
      } else {
        setError('비밀번호가 올바르지 않습니다.');
        setPassword('');
      }
    } catch {
      setError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsVerifying(false);
    }
  };

  // 초기 로딩 (깜빡임 방지)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400 text-sm">로딩 중...</div>
      </div>
    );
  }

  // 인증 완료 → 자식 컴포넌트(관리자 페이지) 표시
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // 비밀번호 입력 잠금 화면
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {/* 자물쇠 아이콘 */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-900 text-white text-2xl mb-4">
              🔒
            </div>
            <h1 className="text-xl font-bold text-gray-900">강사 전용 페이지</h1>
            <p className="text-sm text-gray-500 mt-1">관리자 비밀번호를 입력해주세요</p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 text-center font-medium border border-red-100">
              {error}
            </div>
          )}

          {/* 비밀번호 입력 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              autoFocus
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-center text-lg tracking-widest focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={isVerifying || !password.trim()}
              className={`w-full font-bold py-3.5 rounded-xl text-white transition-all text-base ${
                isVerifying || !password.trim()
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gray-900 hover:bg-gray-800 active:scale-[0.98] shadow-md hover:shadow-lg'
              }`}
            >
              {isVerifying ? '확인 중...' : '입장하기'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 음악 레슨 관리 시스템
        </p>
      </div>
    </div>
  );
}
