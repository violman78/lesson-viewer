'use client';

import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export default function DeleteLessonButton({ lessonId }: { lessonId: string }) {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // 부모 Link로의 이벤트 전파를 완전히 차단하여 페이지 이동을 막습니다.
    
    if (!confirm('정말 이 레슨 기록을 삭제하시겠습니까?\n삭제 후에는 학부모님 페이지에서도 보이지 않으며 복구할 수 없습니다.')) {
      return;
    }
    
    // DB에서 데이터 삭제 (Storage의 파일은 잔류할 수 있지만, 링크 접근은 끊어짐)
    const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
    
    if (error) {
      alert('삭제 중 오류가 발생했습니다: ' + error.message);
    } else {
      alert('삭제되었습니다.');
      router.refresh(); // 삭제 후 목록 새로고침
    }
  };

  return (
    <button 
      onClick={handleDelete}
      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
      title="이 레슨 리포트 삭제하기"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
    </button>
  );
}
