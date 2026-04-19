import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import DeleteLessonButton from './components/DeleteLessonButton';
import FolderSidebarWrapper from './components/FolderSidebarWrapper';
import MoveToFolderMenu from './components/MoveToFolderMenu';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ folderId?: string }>;
}

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  const { folderId } = await searchParams;
  const supabase = createServerSupabaseClient();
  
  // 데이터 불러오기 쿼리 구성 (folders 테이블 미생성 시 자동 폴백)
  let recentLessons: any[] | null = null;

  // 먼저 folders join 포함 쿼리 시도
  let query = supabase
    .from('lessons')
    .select('*, folders(name)')
    .order('created_at', { ascending: false });

  if (folderId) {
    query = query.eq('folder_id', folderId);
  }

  const { data, error } = await query;

  if (error) {
    // folders 테이블/컬럼이 없는 경우 기본 쿼리로 폴백
    console.warn('폴더 조인 실패, 기본 쿼리로 폴백:', error.message);
    const fallback = await supabase
      .from('lessons')
      .select('*')
      .order('created_at', { ascending: false });
    recentLessons = fallback.data;
  } else {
    recentLessons = data;
  }

  const totalLessonsCount = recentLessons?.length || 0;

  return (
    <div className="min-h-screen px-4 py-8 sm:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* 상단 헤더: 프리미엄 그라데이션 타이틀 */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-1">
             <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 leading-tight">
               🎹 레슨 메모 보관소
             </h1>
             <p className="text-gray-500 font-medium">선생님만의 소중한 기록이 안전하게 보관되고 있습니다.</p>
          </div>
          <Link href="/admin/lessons/new" className="premium-gradient hover:opacity-90 text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-lg hover:shadow-indigo-200 active:scale-95 flex items-center gap-2 group">
             <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
             새 레슨 작성하기
          </Link>
        </header>

        {/* 메인 레이아웃: 사이드바 + 목록 */}
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          
          {/* 좌측 사이드바 (폴더 관리) */}
          <div className="w-full lg:w-72 lg:sticky lg:top-10">
            <FolderSidebarWrapper selectedFolderId={folderId || null} />
          </div>

          {/* 우측 목록 섹션: 글래스 카드 스타일 */}
          <section className="flex-1 w-full glass-card rounded-3xl overflow-hidden min-h-[600px]">
             <div className="px-8 py-6 border-b border-white/20 flex justify-between items-center bg-white/40">
               <h2 className="text-xl font-bold text-gray-800">
                 {folderId ? '폴더별 리스트' : '현재 모든 레슨'}
                 <span className="ml-3 text-sm font-bold text-indigo-500/60 bg-indigo-50 px-2.5 py-1 rounded-full">{totalLessonsCount}건</span>
               </h2>
             </div>
             
             {totalLessonsCount === 0 ? (
               <div className="text-center py-40 flex flex-col items-center">
                 <div className="w-20 h-20 bg-indigo-50 flex items-center justify-center rounded-3xl mb-6 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-300"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                 </div>
                 <p className="text-gray-400 font-bold text-lg">{folderId ? '이 폴더는 아직 비어있습니다.' : '등록된 레슨이 없습니다.'}</p>
                 <Link href="/admin/lessons/new" className="text-indigo-600 text-sm mt-3 font-extrabold hover:underline">지금 바로 작성해보기 →</Link>
               </div>
             ) : (
               <ul className="divide-y divide-gray-100/50">
                 {recentLessons!.map((lesson) => (
                   <li key={lesson.id} className="hover:bg-white/60 transition-all group relative">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between px-8 py-7 gap-6">
                       <Link href={`/admin/lessons/${lesson.id}/review`} className="flex-1 group-active:scale-[0.99] transition-transform">
                         <div className="flex items-center gap-3 mb-2">
                           <h3 className="font-black text-gray-900 text-xl tracking-tight">{lesson.student_name}</h3>
                           <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md uppercase tracking-tight">{lesson.instrument}</span>
                         </div>
                         
                         <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mb-4">
                           <span className="text-indigo-600 font-bold">{lesson.book_unit}</span>
                           <span className="text-gray-300">|</span>
                           <span>{lesson.piece_title}</span>
                         </div>
                         
                         <div className="flex flex-wrap items-center gap-2">
                            {/* 날짜 표시 */}
                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100/50">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                              {lesson.lesson_date}
                            </div>
                            {/* 폴더 표시 */}
                            {lesson.folders && (
                              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100/50">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                                {(lesson.folders as any).name}
                              </div>
                            )}
                         </div>

                         {lesson.observation_memo && (
                           <div className="mt-5 bg-white/40 p-4 rounded-2xl border border-white/60 shadow-sm relative overflow-hidden group/memo">
                             <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/20 group-hover/memo:bg-indigo-500 transition-colors"></div>
                             <p className="text-[11px] font-black text-indigo-400 mb-1.5 flex items-center gap-1 uppercase tracking-wider">
                                나의 비밀 메모
                             </p>
                             <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{lesson.observation_memo}</p>
                           </div>
                         )}
                       </Link>

                       <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-100/50">
                         <div className="flex items-center gap-2">
                           <span className={`text-[11px] font-black px-3 py-1.5 rounded-full tracking-wider uppercase shadow-sm ${lesson.status === 'published' ? 'bg-green-500 text-white shadow-green-100' : 'bg-amber-500 text-white shadow-amber-100'}`}>
                             {lesson.status === 'published' ? 'SUCCESS' : 'DRAFT'}
                           </span>
                           <DeleteLessonButton lessonId={lesson.id} />
                         </div>
                         <div className="flex items-center gap-4">
                            <MoveToFolderMenu lessonId={lesson.id} currentFolderId={lesson.folder_id} />
                            <Link href={`/admin/lessons/${lesson.id}/review`} className="hidden sm:flex text-gray-400 hover:text-indigo-600 transition-colors">
                               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                            </Link>
                         </div>
                       </div>
                     </div>
                   </li>
                 ))}
               </ul>
             )}
          </section>

        </div>
      </div>

      {/* 모바일 하단 플로팅 버튼 - 프리미엄 버전 */}
      <Link href="/admin/lessons/new" className="sm:hidden fixed bottom-6 right-6 premium-gradient text-white w-16 h-16 rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-transform z-50 ring-4 ring-white/50">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </Link>
    </div>
  );
}
