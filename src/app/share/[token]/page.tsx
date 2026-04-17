import { createServerSupabaseClient } from '@/lib/supabase/server';

// [중요 변경] 다중 미디어 및 명시적 피드백 구조를 지원하는 새로운 스키마 적용
export type LessonMaterial = {
  type: 'score' | 'student_video' | 'teacher_audio' | 'image' | 'video';
  url: string;
  title?: string;
};

export type AIFeedback = {
  core: string;     // 오늘 레슨 핵심
  good: string;     // 잘한 점
  improve: string;  // 보완할 점
  comment: string;  // 선생님 한 줄 코멘트
  homework: string[]; // 다음 레슨 숙제 (배열)
};

type LessonRecord = {
  student_name: string;
  piece_title: string;
  lesson_date: string;       // 실제 레슨 진행 일자
  materials: LessonMaterial[]; // 다중 미디어 자료 (JSONB)
  ai_feedback: AIFeedback;     // AI 분석 기반 분절형 피드백 (JSONB)
  created_at: string;
  expires_at?: string;
};

export default async function SharedLessonViewerPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createServerSupabaseClient();

  let lesson: any = null;
  let error: any = null;

  // 'demo' 토큰 일 경우 새로운 DB 구조에 맞춘 임시 데이터 제공
  if (token === 'demo') {
    lesson = {
      student_name: '바이올린 꿈나무',
      piece_title: '스즈키 3권 가보트',
      lesson_date: '2026-04-16',
      materials: [
        {
          type: 'score',
          url: 'https://images.unsplash.com/photo-1549834185-bc97fdce4471?q=80&w=2070&auto=format&fit=crop',
          title: '가보트 악보 (보잉 집중 파트)'
        },
        {
          type: 'student_video',
          url: 'https://www.w3schools.com/html/mov_bbb.mp4',
          title: '학생 연주 모니터링 영상'
        }
      ],
      ai_feedback: {
        core: '안정적인 활 쓰기(Bowing) 테크닉 감각 익히기',
        good: '활을 현에 밀착시켜 맑은 소리를 내는 감각이 이전보다 훨씬 좋아졌습니다. 악보를 보는 집중력도 최고였어요!',
        improve: 'G현을 연주할 때 팔꿈치의 각도를 조금 더 들어 올려주시면 더 크고 파워풀한 소리를 낼 수 있습니다.',
        comment: '평소 연습하실 때 거울을 보며 우측 어깨가 올라가지 않는지 확인하시면 빠르게 교정이 될 것입니다. 파이팅!',
        homework: [
          '스즈키 교본 G현 연습곡 집중',
          '메트로놈 60에 맞추어 활 전체 쓰기 하루 10회 반복',
          '거울 10분 보면서 자세 점검하기'
        ]
      },
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
  } else {
    // [중요 변경] 새로운 컬럼(piece_title, lesson_date, materials, ai_feedback) 조회
    const result = await supabase
      .from('lessons')
      .select('student_name, piece_title, lesson_date, materials, ai_feedback, created_at, expires_at')
      .eq('share_token', token)
      .single();
    lesson = result.data;
    error = result.error;
  }

  // 데이터 없거나 에러 처리
  if (error || !lesson) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center bg-gray-50 text-gray-800 font-sans">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-gray-400"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <h1 className="text-xl font-bold mb-2">데이터를 찾을 수 없습니다</h1>
        <p className="text-gray-500 text-sm">유효하지 않은 링크이거나 레슨 정보가 삭제되었습니다.</p>
      </div>
    );
  }

  const data = lesson as LessonRecord;

  // 만료 기한 확인 생략 (기존과 동일)
  if (data.expires_at) {
    const expiredDate = new Date(data.expires_at);
    const currentDate = new Date();
    if (expiredDate < currentDate) {
      return (
        <div className="min-h-screen p-6 flex flex-col items-center justify-center bg-gray-50 text-gray-800 font-sans">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-red-400"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><line x1="10" y1="14" x2="14" y2="18"></line><line x1="14" y1="14" x2="10" y2="18"></line></svg>
          <h1 className="text-xl font-bold mb-2 text-red-500">열람 기간 만료</h1>
          <p className="text-gray-500 text-center text-sm">이 레슨 링크의 조회 유효기간이 지났습니다.<br/>담당 선생님께 다시 문의해 주세요.</p>
        </div>
      );
    }
  }

  const feedback = data.ai_feedback;
  const homeworkList = feedback.homework || [];
  const materials = data.materials || [];
  
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans selection:bg-blue-100 pb-12">
      <div className="max-w-xl mx-auto bg-white min-h-screen sm:min-h-0 sm:mt-8 sm:rounded-3xl sm:shadow-sm sm:border sm:border-gray-100 overflow-hidden">
        
        {/* 상단 1: 핵심 요약 헤더 */}
        <header className="px-6 pt-10 pb-6 border-b border-gray-50 bg-white">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                {data.student_name} <span className="font-medium text-gray-500 text-xl">레슨 노트</span>
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0">
                  {data.piece_title}
                </span>
                <p className="text-gray-400 text-sm font-medium">
                  {new Date(data.lesson_date).toLocaleDateString('ko-KR', { 
                     year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' 
                  })}
                </p>
              </div>
            </div>
            {/* AI Report 문구 */}
            <div className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider">
              AI ASSISTED
            </div>
          </div>
          
          <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100/50">
            <h2 className="text-sm font-bold text-blue-800 mb-1">오늘 레슨의 핵심</h2>
            <p className="text-blue-950 font-medium text-[15px] leading-snug">
              {feedback.core}
            </p>
          </div>
          
          {/* Quick Navigation (Table of Contents) */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {materials.length > 0 && (
              <a href="#materials" className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-700 transition-all text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500">
                <span className="text-xl">🎼</span>
                <span className="text-[11px] font-bold">레슨 자료({materials.length})</span>
              </a>
            )}
            <a href="#feedback" className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 hover:bg-emerald-50 hover:border-emerald-100 hover:text-emerald-700 transition-all text-gray-600 outline-none focus:ring-2 focus:ring-emerald-500">
              <span className="text-xl">✨</span>
              <span className="text-[11px] font-bold">상세 피드백</span>
            </a>
            {homeworkList.length > 0 && (
              <a href="#homework" className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 hover:bg-amber-50 hover:border-amber-100 hover:text-amber-700 transition-all text-gray-600 outline-none focus:ring-2 focus:ring-amber-500">
                <span className="text-xl">📝</span>
                <span className="text-[11px] font-bold">연습 과제({homeworkList.length})</span>
              </a>
            )}
          </div>
        </header>

        <div className="px-6 py-6 space-y-8 bg-[#FCFDFD]">

          {/* 본문 1: [핵심] 다중 학습 미디어 자료 구조화 */}
          {materials.length > 0 && (
            <section id="materials" className="space-y-3 scroll-mt-6">
              <h3 className="text-sm font-bold text-gray-400 flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                레슨 자료 ({materials.length})
              </h3>
              
              <div className="grid gap-4">
                {materials.map((mat, idx) => (
                  <div key={idx} className="rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm">
                    {mat.title && (
                      <div className="bg-gray-50 px-3 py-2 border-b border-gray-100 text-xs font-semibold text-gray-600 flex justify-between">
                        <span>{mat.title}</span>
                        <span className="uppercase text-gray-400 font-mono tracking-wider">{mat.type.replace('_', ' ')}</span>
                      </div>
                    )}
                    {mat.type.includes('video') ? (
                      <video className="w-full aspect-video object-cover" controls src={mat.url} />
                    ) : mat.type.includes('audio') ? (
                      <div className="p-4 flex items-center justify-center">
                        <audio controls className="w-full h-10" src={mat.url} />
                      </div>
                    ) : (
                      <img className="w-full max-h-64 object-contain" src={mat.url} alt={mat.title || "레슨 자료"} loading="lazy" />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 본문 2: 분절된 피드백 */}
          <section id="feedback" className="space-y-4 scroll-mt-6">
             <h3 className="text-sm font-bold text-gray-400 flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                상세 피드백
             </h3>
             <div className="grid gap-3">
               <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                 <div className="text-emerald-700 font-bold text-xs mb-1.5 flex items-center gap-1">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 잘한 점
                 </div>
                 <p className="text-gray-700 text-sm leading-relaxed">{feedback.good}</p>
               </div>
               
               <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                 <div className="text-amber-700 font-bold text-xs mb-1.5 flex items-center gap-1">
                   <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> 보완할 점
                 </div>
                 <p className="text-gray-700 text-sm leading-relaxed">{feedback.improve}</p>
               </div>
               
               <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                 <div className="text-gray-600 font-bold text-xs mb-1.5 flex items-center gap-1">
                   <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> 선생님 코멘트
                 </div>
                 <p className="text-gray-700 text-[15px] font-medium leading-relaxed">"{feedback.comment}"</p>
               </div>
             </div>
          </section>

          {/* 본문 3: 숙제 체크리스트 */}
          {homeworkList.length > 0 && (
            <section id="homework" className="space-y-3 scroll-mt-6">
               <h3 className="text-sm font-bold text-gray-400 flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                  다음 레슨까지 숙제
               </h3>
               <ul className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100 shadow-sm">
                 {homeworkList.map((hw, idx) => (
                   <li key={idx} className="flex items-start gap-3 p-4 hover:bg-gray-50/50 transition-colors">
                     <div className="mt-0.5 min-w-5">
                       <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center bg-gray-50 cursor-pointer hover:border-indigo-400 transition-colors"></div>
                     </div>
                     <span className="text-gray-700 text-sm font-medium leading-snug">{hw}</span>
                   </li>
                 ))}
               </ul>
            </section>
          )}

        </div>

        {/* 하단 안내문 */}
        <footer className="px-6 py-6 text-center border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-400 font-medium">
             이 안내장은 {data.expires_at ? new Date(data.expires_at).toLocaleDateString() + '까지' : '일정 기간 동안'} 열람 가능합니다.
          </p>
        </footer>
        
      </div>
    </div>
  );
}
