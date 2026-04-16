import { createServerSupabaseClient } from '@/lib/supabase/server';

// Supabase 테이블 lessons의 스키마 타입
type LessonRecord = {
  student_name: string;
  generated_text: string;
  homework?: string;
  media_url?: string;
  media_type?: 'video' | 'audio' | 'image';
  created_at: string;
  expires_at?: string;
};

export default async function SharedLessonViewerPage({ params }: { params: { token: string } }) {
  const { token } = params;
  const supabase = createServerSupabaseClient();

  // Supabase에서 필요한 컬럼만 추출하여 1건 조회
  const { data: lesson, error } = await supabase
    .from('lessons')
    .select('student_name, generated_text, homework, media_url, media_type, created_at, expires_at')
    .eq('share_token', token)
    .single();

  // 데이터가 없거나 에러 발생 시 안내 문구 표시
  if (error || !lesson) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center bg-zinc-950 text-white font-sans">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-zinc-600"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <h1 className="text-2xl font-bold mb-2">데이터를 찾을 수 없습니다</h1>
        <p className="text-zinc-400">유효하지 않은 링크이거나 레슨 정보가 삭제되었습니다.</p>
      </div>
    );
  }

  // 데이터 타입 단언
  const data = lesson as LessonRecord;

  // 만료 기한 확인 (expires_at 이 현재 시간보다 이전일 경우)
  if (data.expires_at) {
    const expiredDate = new Date(data.expires_at);
    const currentDate = new Date();
    
    if (expiredDate < currentDate) {
      return (
        <div className="min-h-screen p-6 flex flex-col items-center justify-center bg-zinc-950 text-white font-sans">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-rose-500"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><line x1="10" y1="14" x2="14" y2="18"></line><line x1="14" y1="14" x2="10" y2="18"></line></svg>
          <h1 className="text-2xl font-bold mb-2 text-rose-500">열람 기간 만료</h1>
          <p className="text-zinc-400 text-center">이 레슨 링크의 조회 유효기간이 지났습니다.<br/>담당 선생님께 다시 문의해 주세요.</p>
        </div>
      );
    }
  }

  const isDark = true;

  return (
    <div className={`min-h-screen p-6 sm:p-12 ${isDark ? 'bg-zinc-950 text-white' : 'bg-slate-50 text-slate-900'} font-sans selection:bg-indigo-500/30`}>
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both">
        
        {/* 헤더 섹션 */}
        <header className="space-y-4">
          <div className="flex items-center gap-3 text-indigo-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
            <span className="text-sm font-semibold tracking-wider uppercase">AI Lesson Report</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            {data.student_name} 학생 레슨 결과
          </h1>
          <p className="text-zinc-400 font-medium text-lg">
            {new Date(data.created_at).toLocaleDateString('ko-KR', { 
               year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' 
            })}
          </p>
        </header>

        {/* 미디어 뷰어 섹션 */}
        {data.media_url && data.media_type && (
          <section className="mt-8 rounded-3xl overflow-hidden bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 shadow-2xl">
            {data.media_type === 'video' ? (
              <div className="aspect-video bg-black flex items-center justify-center relative group">
                <video 
                  className="w-full h-full object-cover" 
                  controls 
                  src={data.media_url} 
                />
              </div>
            ) : data.media_type === 'audio' ? (
              <div className="p-6 sm:p-8 bg-zinc-800/30 flex flex-col items-center justify-center gap-6">
                <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/50 hover:bg-indigo-500/30 transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>
                </div>
                <audio controls className="w-full max-w-md" src={data.media_url} />
              </div>
            ) : data.media_type === 'image' ? (
              <div className="w-full bg-black/40 flex items-center justify-center">
                <img 
                  className="w-full h-auto object-contain max-h-[70vh]" 
                  src={data.media_url} 
                  alt="Lesson Media"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-500 border-t border-zinc-800/50">
                 지원하지 않는 미디어 형식입니다.
              </div>
            )}
          </section>
        )}

        {/* 생성된 텍스트 피드백 섹션 */}
        {data.generated_text && (
          <section className="bg-zinc-900/40 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 backdrop-blur-sm relative overflow-hidden shadow-xl mt-6">
            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-cyan-500"></div>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-zinc-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              선생님의 종합 피드백
            </h2>
            <div className="text-zinc-300 leading-relaxed sm:text-lg whitespace-pre-wrap">
              {data.generated_text}
            </div>
          </section>
        )}

        {/* 숙제(Homework) 섹션 */}
        {data.homework && (
          <section className="bg-zinc-900/40 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 backdrop-blur-sm relative overflow-hidden shadow-xl mt-4">
            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-emerald-500 to-teal-500"></div>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-zinc-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-400"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
              다음 레슨까지 숙제
            </h2>
            <div className="text-zinc-300 leading-relaxed sm:text-lg whitespace-pre-wrap">
              {data.homework}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
