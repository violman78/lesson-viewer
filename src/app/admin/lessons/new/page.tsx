"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { uploadMaterials, FileUploadTask } from '@/lib/supabase/storage';

export default function NewLessonPage() {
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    studentName: '',
    instrument: '',  
    lessonDate: '', 
    bookUnit: '',    
    pieceTitle: ''   
  });

  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [folderReady, setFolderReady] = useState(false);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      lessonDate: new Date().toISOString().split('T')[0]
    }));

    async function fetchFolders() {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase.from('folders').select('*').order('name');
        if (!error && data) {
          setFolders(data);
          setFolderReady(true);
        }
      } catch (e) {
        console.warn('folders 테이블 미생성 상태 - 폴더 기능 비활성화');
      }
    }
    fetchFolders();
  }, []);

  const [memos, setMemos] = useState({
    observationMemo: '', 
    aiReferenceMemo: ''  
  });
  
  const [scoreFiles, setScoreFiles] = useState<File[]>([]);
  const [studentVideoFiles, setStudentVideoFiles] = useState<File[]>([]);
  const [teacherDemoFiles, setTeacherDemoFiles] = useState<File[]>([]);

  const handleUploadAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName) return setErrorMsg('학생 이름을 입력해주세요.');
    if (!formData.lessonDate) return setErrorMsg('레슨 날짜를 선택해주세요.');
    
    const totalFilesCount = scoreFiles.length + studentVideoFiles.length + teacherDemoFiles.length;
    if (totalFilesCount === 0 && !memos.aiReferenceMemo && !memos.observationMemo) {
      return setErrorMsg('업로드된 자료나 메모가 최소 1개 이상 필요합니다.');
    }

    setIsSubmitting(true);
    setErrorMsg('');
    const supabase = createBrowserSupabaseClient();

    try {
      const folderPath = `lesson_${Date.now()}`;
      
      const uploadTasks: FileUploadTask[] = [
        ...scoreFiles.map(file => ({ file, materialType: 'score' as const })),
        ...studentVideoFiles.map(file => ({ file, materialType: 'student_video' as const })),
        ...teacherDemoFiles.map(file => ({ file, materialType: 'teacher_demo' as const }))
      ];

      setStatusMsg(`레슨 자료(${totalFilesCount}개)를 업로드 중입니다... (1/2)`);
      const uploadedMaterials = uploadTasks.length > 0 
        ? await uploadMaterials(uploadTasks, folderPath) 
        : [];

      setStatusMsg('레슨 정보를 안전하게 저장하는 중입니다... (2/2)');
      
      const token = crypto.randomUUID();
      const insertData: any = {
          share_token: token,
          student_name: formData.studentName,
          instrument: formData.instrument,
          book_unit: formData.bookUnit,
          piece_title: formData.pieceTitle,
          lesson_date: formData.lessonDate, 
          materials: uploadedMaterials, 
          observation_memo: memos.observationMemo, 
          ai_reference_memo: memos.aiReferenceMemo, 
          ai_feedback: {}, 
          status: 'draft',
        };

      // folder_id 컬럼이 DB에 있는 경우에만 추가
      if (folderReady && selectedFolderId) {
        insertData.folder_id = selectedFolderId;
      }

      let { data: newLesson, error: dbError } = await supabase
        .from('lessons')
        .insert(insertData)
        .select()
        .single();

      // folder_id 컬럼이 아직 없으면 해당 필드 제거 후 재시도
      if (dbError && (dbError.message?.includes('folder_id') || dbError.code === '42703')) {
        console.warn('folder_id 컬럼이 아직 없습니다. 폴더 지정 없이 저장합니다.');
        delete insertData.folder_id;
        const retry = await supabase
          .from('lessons')
          .insert(insertData)
          .select()
          .single();
        newLesson = retry.data;
        dbError = retry.error;
      }

      if (dbError) throw new Error(dbError.message || JSON.stringify(dbError));

      setStatusMsg('레슨 저장 완료! 분석 페이지로 이동합니다.');
      router.push(`/admin/lessons/${newLesson.id}/review`);

    } catch (err: any) {
      console.error('저장 오류 상세:', err);
      setErrorMsg(err.message || JSON.stringify(err) || '저장 중 오류가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-10 sm:p-14 font-sans pb-32 relative overflow-hidden">
      {/* 백그라운드 효과 */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200/20 blur-[100px] -z-10 rounded-full"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200/20 blur-[100px] -z-10 rounded-full"></div>

      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <button 
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-gray-400 hover:text-indigo-600 font-bold text-sm mb-6 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><path d="m15 18-6-6 6-6"></path></svg>
            돌아가기
          </button>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">
            🆕 새 레슨 기록
          </h1>
          <p className="text-gray-500 font-medium">선생님만의 소중한 기록을 프리미엄 디자인으로 시작하세요.</p>
        </div>

        <form onSubmit={handleUploadAndSave} className="space-y-10">
          
          {/* 기본 정보 */}
          <section className="glass-card p-8 rounded-3xl shadow-xl border-white/40">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-gray-800">
               <span className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-indigo-100 italic">01</span>
               레슨 기본 정보
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Student Name</label>
                <input 
                  type="text" 
                  className="w-full bg-white/40 border border-white/60 rounded-2xl p-4 font-bold text-gray-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-300 shadow-inner" 
                  value={formData.studentName}
                  onChange={e => setFormData({...formData, studentName: e.target.value})}
                  required 
                  placeholder="학생 이름을 입력하세요"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Lesson Date</label>
                <input 
                  type="date" 
                  className="w-full bg-white/40 border border-white/60 rounded-2xl p-4 font-bold text-gray-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-inner" 
                  value={formData.lessonDate}
                  onChange={e => setFormData({...formData, lessonDate: e.target.value})}
                  required 
                />
              </div>
              {folderReady && (
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Folder</label>
                <select 
                  className="w-full bg-white/40 border border-white/60 rounded-2xl p-4 font-bold text-gray-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all cursor-pointer shadow-inner appearance-none"
                  value={selectedFolderId}
                  onChange={e => setSelectedFolderId(e.target.value)}
                >
                  <option value="">미분류 (Unsorted)</option>
                  {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              )}
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Instrument</label>
                <input 
                  type="text" 
                  className="w-full bg-white/40 border border-white/60 rounded-2xl p-4 font-bold text-gray-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-300 shadow-inner" 
                  value={formData.instrument}
                  onChange={e => setFormData({...formData, instrument: e.target.value})}
                  placeholder="예: 바이올린, 첼로"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Book & Unit</label>
                <input 
                  type="text" 
                  className="w-full bg-white/40 border border-white/60 rounded-2xl p-4 font-bold text-gray-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-300 shadow-inner" 
                  value={formData.bookUnit}
                  onChange={e => setFormData({...formData, bookUnit: e.target.value})}
                  placeholder="예: 스즈키 3권, 호만 1단계"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Piece Title</label>
                <input 
                  type="text" 
                  className="w-full bg-white/40 border border-white/60 rounded-2xl p-4 font-bold text-gray-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-300 shadow-inner" 
                  value={formData.pieceTitle}
                  onChange={e => setFormData({...formData, pieceTitle: e.target.value})}
                  placeholder="예: 바흐 미뉴에트, 가보트"
                />
              </div>
            </div>
          </section>

          {/* 자료 업로드 */}
          <section className="glass-card p-8 rounded-3xl shadow-xl border-white/40">
             <h2 className="text-xl font-bold mb-8 flex items-center gap-3 text-gray-800">
               <span className="w-10 h-10 flex items-center justify-center bg-purple-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-purple-100 italic">02</span>
               미디어 라이브러리 추가
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: '🎼 Score & Photos', files: scoreFiles, set: setScoreFiles, accept: 'image/*,application/pdf', color: 'bg-indigo-50', icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
                { label: '📼 Student Video', files: studentVideoFiles, set: setStudentVideoFiles, accept: 'video/*', color: 'bg-rose-50', icon: 'm22 7-8.5 8.5L10 11 2 19' },
                { label: '🎙️ Demo & Audio', files: teacherDemoFiles, set: setTeacherDemoFiles, accept: 'video/*,audio/*', color: 'bg-amber-50', icon: 'M12 1v22M19 8l-7 7-7-7' },
              ].map((item, idx) => (
                <div key={idx} className={`relative group/upload ${item.color}/40 p-6 rounded-3xl border border-white transition-all hover:bg-white hover:shadow-xl hover:-translate-y-1`}>
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-800 mb-2`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-gray-800 mb-1">{item.label}</h3>
                      <p className="text-[10px] font-bold text-gray-400 px-4 uppercase tracking-tighter">Tap to upload files</p>
                    </div>
                    <label className="absolute inset-0 cursor-pointer opacity-0">
                      <input 
                        type="file" 
                        multiple 
                        accept={item.accept} 
                        onChange={e => item.set(prev => [...prev, ...Array.from(e.target.files || [])])} 
                      />
                    </label>
                  </div>
                  {item.files.length > 0 && (
                    <div className="mt-6 space-y-2">
                      {item.files.map((f, fIdx) => (
                        <div key={fIdx} className="bg-white/80 backdrop-blur-sm px-3 py-2 rounded-xl text-[10px] font-black text-gray-600 border border-white flex items-center justify-between group/item shadow-sm">
                          <span className="truncate max-w-[100px]">{f.name}</span>
                          <button type="button" onClick={() => item.set(prev => prev.filter((_, i) => i !== fIdx))} className="text-gray-300 hover:text-rose-500 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 메모 섹션 */}
          <section className="glass-card p-8 rounded-3xl shadow-xl border-white/40">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-3 text-gray-800">
               <span className="w-10 h-10 flex items-center justify-center bg-amber-500 text-white rounded-2xl text-sm font-black shadow-lg shadow-amber-100 italic">03</span>
               레슨 인사이트
            </h2>
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="block text-[11px] font-black text-gray-400 ml-1 uppercase tracking-widest">Observation Memo (Private)</label>
                <textarea 
                  className="w-full bg-white/40 border border-white/60 rounded-3xl p-6 font-bold text-gray-800 focus:ring-4 focus:ring-gray-200/50 outline-none transition-all min-h-[140px] placeholder:text-gray-300 shadow-inner"
                  placeholder="학생의 성향, 연습 태도 등 선생님만 보실 수 있는 기록을 남겨보세요..."
                  value={memos.observationMemo}
                  onChange={e => setMemos({...memos, observationMemo: e.target.value})}
                />
              </div>
              <div className="space-y-3 p-8 bg-indigo-600 rounded-[40px] shadow-2xl shadow-indigo-200 relative overflow-hidden group/ai">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 blur-3xl rounded-full transition-transform group-hover/ai:scale-150 duration-700"></div>
                <label className="block text-[11px] font-black text-indigo-200 ml-1 uppercase tracking-widest mb-1 flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>
                   AI Report Guide (Public Feedback)
                </label>
                <textarea 
                  className="w-full bg-indigo-500/30 border border-white/20 rounded-2xl p-6 font-bold text-white focus:ring-4 focus:ring-white/10 outline-none transition-all min-h-[140px] placeholder:text-indigo-200/60 shadow-inner resize-none"
                  placeholder="학부모님께 전달될 AI 리포트에 꼭 들어갔으면 하는 내용을 적어주세요!"
                  value={memos.aiReferenceMemo}
                  onChange={e => setMemos({...memos, aiReferenceMemo: e.target.value})}
                />
                <p className="text-[11px] font-bold text-indigo-100/60 mt-4 px-1 italic">
                  ※ 이 내용은 데이터 분석 후 학부모용 프리미엄 리포트로 재구성됩니다.
                </p>
              </div>
            </div>
          </section>

          {/* 하단 고정 액션바 */}
          <div className="fixed bottom-0 left-0 right-0 p-8 bg-white/60 backdrop-blur-3xl border-t border-white/20 z-40">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
               <div className="hidden sm:block">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5 italic">Ready to archive?</p>
                  <p className="text-sm font-black text-indigo-600">완료 버튼을 눌러 레슨 리포트를 생성하세요.</p>
               </div>
               <button 
                type="submit" 
                disabled={isSubmitting}
                className={`flex-1 sm:flex-none sm:min-w-[280px] premium-gradient hover:opacity-90 text-white font-black py-5 px-10 rounded-2xl transition-all shadow-2xl shadow-indigo-200 active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="animate-pulse">{statusMsg || 'Archiving...'}</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v13a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                    <span>레슨 보관 및 분석 시작</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>

        {errorMsg && (
          <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-rose-500 text-white px-8 py-4 rounded-3xl font-black shadow-2xl z-50 animate-in slide-in-from-top-10 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}
