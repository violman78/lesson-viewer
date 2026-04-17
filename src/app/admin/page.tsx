import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import DeleteLessonButton from './components/DeleteLessonButton';

export default async function AdminDashboardPage() {
  const supabase = createServerSupabaseClient();
  
  // 최근 생성된 레슨 데이터 불러오기
  const { data: recentLessons } = await supabase
    .from('lessons')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  const totalLessonsCount = recentLessons?.length || 0;

  return (
    <div className="min-h-screen p-6 sm:p-10 bg-gray-50 text-gray-900 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* 상단 헤더 */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:px-8 sm:py-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
             <h1 className="text-2xl font-extrabold tracking-tight">📝 레슨 메모 기록 보관소</h1>
             <p className="text-gray-500 font-medium mt-1">지금까지 작성된 모든 관찰 메모와 리포트가 안전하게 보관됩니다.</p>
          </div>
          <Link href="/admin/lessons/new" className="hidden sm:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
             새 메모 & 리포트 작성
          </Link>
        </header>

        {/* 메인 통계 / 목록 컨테이너 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <aside className="space-y-6">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">주간 분석 요약</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-3xl font-extrabold">{totalLessonsCount}<span className="text-lg text-gray-500 font-medium ml-1">건</span></p>
                    <p className="text-gray-500 text-sm mt-1">지금까지 생성된 리포트</p>
                  </div>
                </div>
             </div>
          </aside>

          <section className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
               <h2 className="text-lg font-bold">최근 작성된 레슨 리포트</h2>
             </div>
             
             {totalLessonsCount === 0 ? (
               <div className="text-center py-24 flex flex-col items-center">
                 <div className="w-16 h-16 bg-gray-50 flex items-center justify-center rounded-full mb-4 outline outline-8 outline-gray-50/50">
                   <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                 </div>
                 <p className="text-gray-400 font-medium">아직 등록된 레슨 기록이 없습니다.</p>
                 <p className="text-gray-400 text-sm mt-1">상단의 '새 레슨 기록 작성' 버튼을 눌러 시작하세요.</p>
               </div>
             ) : (
               <ul className="divide-y divide-gray-100">
                 {recentLessons!.map((lesson) => (
                   <li key={lesson.id} className="hover:bg-gray-50 transition-colors">
                     <Link href={`/admin/lessons/${lesson.id}/review`} className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 gap-4">
                       <div className="flex-1">
                         <div className="flex items-center justify-between sm:justify-start gap-4 mb-1">
                           <p className="font-bold text-gray-900 text-lg">{lesson.student_name} 학생 <span className="text-sm font-medium text-gray-500 ml-1">{lesson.instrument}</span></p>
                           <p className="text-xs text-gray-400 sm:hidden">{lesson.lesson_date}</p>
                         </div>
                         <p className="text-sm text-gray-500">{lesson.book_unit} · {lesson.piece_title}</p>
                         
                         {/* 메모 보관소 역할 - 강사 관찰 메모 표시 */}
                         {lesson.observation_memo && (
                           <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                             <p className="text-[10px] font-bold text-gray-400 mb-1 flex items-center gap-1">
                               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                               나의 비밀 관찰 내용
                             </p>
                             <p className="text-sm text-gray-700 leading-snug line-clamp-2">{lesson.observation_memo}</p>
                           </div>
                         )}
                       </div>
                       <div className="text-left sm:text-right flex items-center justify-between sm:flex-col sm:items-end">
                         <div className="flex items-center gap-2">
                           <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${lesson.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                             {lesson.status === 'published' ? '공유됨' : '작성 및 대기중'}
                           </span>
                           <DeleteLessonButton lessonId={lesson.id} />
                         </div>
                         <p className="hidden sm:block text-xs text-gray-400 mt-2">{lesson.lesson_date}</p>
                       </div>
                     </Link>
                   </li>
                 ))}
               </ul>
             )}
          </section>

        </div>
      </div>

      {/* 모바일 최적화: 우측 하단 플로팅 버튼(FAB) */}
      <Link href="/admin/lessons/new" className="sm:hidden fixed bottom-6 right-6 bg-indigo-600 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:bg-indigo-700 active:scale-90 transition-transform z-50">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </Link>
    </div>
  );
}
