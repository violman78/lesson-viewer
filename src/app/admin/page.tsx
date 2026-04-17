import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen p-6 sm:p-10 bg-gray-50 text-gray-900 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* 상단 헤더 */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:px-8 sm:py-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
             <h1 className="text-2xl font-extrabold tracking-tight">강사 대시보드</h1>
             <p className="text-gray-500 font-medium mt-1">오늘 진행할 레슨과 완료된 리포트를 관리하세요.</p>
          </div>
          <Link href="/admin/lessons/new" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow hover:shadow-md active:scale-95">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
             새 레슨 기록 작성
          </Link>
        </header>

        {/* 메인 통계 / 목록 컨테이너 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 사이드바 통계 */}
          <aside className="space-y-6">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">주간 분석 요약</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-3xl font-extrabold">12<span className="text-lg text-gray-500 font-medium ml-1">건</span></p>
                    <p className="text-gray-500 text-sm mt-1">이번 주 생성된 리포트</p>
                  </div>
                  <hr className="border-gray-100" />
                  <div>
                    <p className="text-3xl font-extrabold text-indigo-600">32<span className="text-lg text-gray-400 font-medium ml-1">분</span></p>
                    <p className="text-gray-500 text-sm mt-1">AI가 단축해준 업무 시간</p>
                  </div>
                </div>
             </div>
          </aside>

          {/* 메인 목록 */}
          <section className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
               <h2 className="text-lg font-bold">최근 작성된 레슨 리포트</h2>
               <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full cursor-pointer hover:bg-indigo-100">전체 보기</span>
             </div>
             
             {/* 현재는 데모 상태이므로 빈 상태 메시지 출력 */}
             <div className="text-center py-24 flex flex-col items-center">
               <div className="w-16 h-16 bg-gray-50 flex items-center justify-center rounded-full mb-4 outline outline-8 outline-gray-50/50">
                 <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
               </div>
               <p className="text-gray-400 font-medium">아직 등록된 레슨 기록이 없습니다.</p>
               <p className="text-gray-400 text-sm mt-1">상단의 '새 레슨 기록 작성' 버튼을 눌러 시작하세요.</p>
             </div>
          </section>

        </div>
      </div>
    </div>
  );
}
