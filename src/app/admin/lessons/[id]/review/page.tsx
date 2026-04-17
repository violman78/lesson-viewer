"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export default function ReviewLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [lessonId, setLessonId] = useState<string | null>(null);
  
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // 편집용 상태
  const [feedbackDraft, setFeedbackDraft] = useState({
    core: '',
    good: '',
    improve: '',
    comment: '',
    homework: '' // 배열 줄바꿈 매핑용
  });
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const resolvedParams = await params;
        setLessonId(resolvedParams.id);
        
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', resolvedParams.id)
          .single();
          
        if (error) throw error;
        setLesson(data);
        
        if (data.ai_feedback && Object.keys(data.ai_feedback).length > 0) {
          setFeedbackDraft({
             core: data.ai_feedback.core || '',
             good: data.ai_feedback.good || '',
             improve: data.ai_feedback.improve || '',
             comment: data.ai_feedback.comment || '',
             homework: Array.isArray(data.ai_feedback.homework) ? data.ai_feedback.homework.join('\n') : (data.ai_feedback.homework || '')
          });
        }
      } catch (err: any) {
        setErrorMsg('데이터를 불러오는 중 오류가 발생했습니다: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [params]);

  // [Phase 3] 실제 AI 연동 API Endpoint 호출
  const handleGenerateAI = async () => {
    if (!lesson) return;
    
    // 1. 프론트엔드 방어 로직: 
    // 자료(materials)가 아예 없고 지시사항(ai_reference_memo)도 없으면 
    // 모델이 환각(Hallucination)을 쓸 우려가 있으므로 생성을 원천 차단함.
    const materialsCount = lesson.materials?.length || 0;
    if (materialsCount === 0 && !lesson.ai_reference_memo) {
      alert('분석할 참조 메모나 첨부 자료가 부족합니다. AI 분석을 실행할 수 없습니다.');
      return;
    }

    setIsGeneratingAI(true);
    setErrorMsg('');

    try {
      // 2. 백엔드 API 라우트로 원본 데이터 패키지 전체 전송
      const response = await fetch('/api/generate-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lesson)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'AI 서버 연동 중 에러가 발생했습니다.');
      }

      // 3. 반환받은 구조화된 응답 JSON을 편집용 폼 UI 상태에 그대로 주입
      setFeedbackDraft({
        core: data.core || '',
        good: data.good || '',
        improve: data.improve || '',
        comment: data.comment || '',
        // API 리턴형인 Array를 텍스트박스 관리용 형태(줄바꿈)로 join 치환
        homework: Array.isArray(data.homework) ? data.homework.join('\n') : (data.homework || '')
      });

      alert('AI 초안 생성이 완료되었습니다! 내용을 다듬은 후 우측 하단에서 [초안 임시 저장]을 눌러 기록해주세요.');
    } catch (err: any) {
      setErrorMsg(err.message);
      alert('AI 생성 실패: ' + err.message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSaveAndPublish = async (nextStatus: 'reviewing' | 'published') => {
    if (!lessonId) return;
    setIsSaving(true);
    setErrorMsg('');
    const supabase = createBrowserSupabaseClient();
    
    try {
      const payload = {
        ai_feedback: {
          core: feedbackDraft.core,
          good: feedbackDraft.good,
          improve: feedbackDraft.improve,
          comment: feedbackDraft.comment,
          homework: feedbackDraft.homework.split('\n').filter(h => h.trim() !== '')
        },
        status: nextStatus
      };

      const { error } = await supabase
        .from('lessons')
        .update(payload)
        .eq('id', lessonId);
        
      if (error) throw error;
      
      if (nextStatus === 'published') {
         alert('발행 상태로 전환 성공! 공유용 접속 화면으로 이동합니다.');
         router.push(`/share/${lesson.share_token}`);
      } else {
         alert('작성하신 내용이 임시 저장(Draft -> Reviewing) 되었습니다.');
         setLesson({...lesson, status: 'reviewing'});
      }
    } catch (err: any) {
       setErrorMsg('저장 실패: ' + err.message);
    } finally {
       setIsSaving(false);
    }
  };

  if (loading) return <div className="p-10 font-bold">로딩 중...</div>;
  if (!lesson) return <div className="p-10 font-bold text-red-500">{errorMsg || '데이터를 찾을 수 없습니다.'}</div>;

  const materials = lesson.materials || [];
  const scoreFiles = materials.filter((m: any) => m.type === 'score');
  const videoFiles = materials.filter((m: any) => m.type === 'student_video');
  const demoFiles = materials.filter((m: any) => m.type === 'teacher_demo');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row pb-20 md:pb-0 h-screen overflow-hidden text-gray-900">
      
      {/* 왼쪽: 원본 뷰어 */}
      <div className="w-full md:w-[45%] bg-white border-r border-gray-200 overflow-y-auto p-6 md:p-8 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-extrabold mb-1">레슨 자료 백업 원본</h1>
          <p className="text-xs text-gray-500">이 데이터들을 기반으로 우측 AI가 분석을 수행합니다.</p>
        </div>

        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
          <h2 className="text-sm font-bold text-gray-700 mb-3 border-b pb-2">기본 정보</h2>
          <ul className="text-sm space-y-2">
            <li><strong>학생명:</strong> {lesson.student_name}</li>
            <li><strong>악기:</strong> {lesson.instrument || '-'}</li>
            <li><strong>날짜:</strong> {lesson.lesson_date}</li>
            <li><strong>교재/진도:</strong> {lesson.book_unit || '-'}</li>
            <li><strong>곡명:</strong> {lesson.piece_title || '-'}</li>
          </ul>
        </div>

        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 space-y-4">
          <h2 className="text-sm font-bold text-gray-700 border-b pb-2">스토리지 업로드 자료 목록</h2>
          <div>
            <h3 className="text-xs font-semibold text-gray-500 mb-1">🎼 악보 ({scoreFiles.length}건)</h3>
            <ul className="text-[13px] pl-2">{scoreFiles.map((f: any, i:number) => <li key={i} className="truncate select-all text-indigo-600 underline cursor-pointer">{f.title || f.url.split('/').pop()}</li>)}</ul>
          </div>
          <div>
             <h3 className="text-xs font-semibold text-gray-500 mb-1">👀 연주 모니터링 ({videoFiles.length}건)</h3>
             <ul className="text-[13px] pl-2">{videoFiles.map((f: any, i:number) => <li key={i} className="truncate select-all text-indigo-600 underline cursor-pointer">{f.title || f.url.split('/').pop()}</li>)}</ul>
          </div>
          <div>
             <h3 className="text-xs font-semibold text-gray-500 mb-1">🎹 강사 시범 ({demoFiles.length}건)</h3>
             <ul className="text-[13px] pl-2">{demoFiles.map((f: any, i:number) => <li key={i} className="truncate select-all text-indigo-600 underline cursor-pointer">{f.title || f.url.split('/').pop()}</li>)}</ul>
          </div>
        </div>

        <div className="bg-amber-50 p-5 rounded-xl border border-amber-100 space-y-4">
          <h2 className="text-sm font-bold text-amber-900 border-b border-amber-200 pb-2">레슨 메모 기록 보관소</h2>
          <div>
            <span className="block text-[11px] font-bold text-gray-500">관찰 메모 (내부용 보관자료)</span>
            <p className="text-sm mt-1 whitespace-pre-wrap">{lesson.observation_memo || '-'}</p>
          </div>
          <div>
            <span className="block text-[11px] font-bold text-indigo-600">AI 피드백 강제 참조 지시사항 (핵심 프롬프트 소스)</span>
            <p className="text-sm mt-1 whitespace-pre-wrap font-medium">{lesson.ai_reference_memo || '-'}</p>
          </div>
        </div>
      </div>

      {/* 오른쪽: AI 에디터 폼 */}
      <div className="w-full md:flex-1 bg-gray-50 overflow-y-auto flex flex-col relative">
        <div className="p-6 md:p-8 flex-1 max-w-2xl w-full mx-auto flex flex-col gap-6">
          
          {errorMsg && (
             <div className="bg-red-50 text-red-600 font-bold p-3 rounded-lg border border-red-200 text-sm">
                [경고] {errorMsg}
             </div>
          )}

          <div className="flex justify-between items-start">
             <div>
               <h1 className="text-xl font-extrabold text-indigo-900">결과 초안 작업대</h1>
               <p className="text-xs text-gray-500 mt-1">상태: <span className="font-bold text-indigo-600 uppercase">{lesson.status}</span></p>
             </div>
             
             <button 
               onClick={handleGenerateAI}
               disabled={isGeneratingAI}
               className={`px-4 py-2 text-sm font-bold rounded-lg shadow-sm w-44 transition-all flex items-center justify-center ${isGeneratingAI ? 'bg-indigo-200 text-indigo-600 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'}`}
             >
               {isGeneratingAI ? '통신 및 분석 중...' : '✨ AI 피드백 모델 실행'}
             </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">오늘 레슨 핵심</label>
              <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-indigo-500 outline-none" value={feedbackDraft.core} onChange={e => setFeedbackDraft({...feedbackDraft, core: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-emerald-600 mb-1.5">잘한 점 칭찬 내역</label>
                <textarea className="w-full h-28 bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 text-sm focus:border-emerald-400 outline-none resize-none" value={feedbackDraft.good} onChange={e => setFeedbackDraft({...feedbackDraft, good: e.target.value})} />
              </div>
              <div>
                 <label className="block text-xs font-bold text-amber-600 mb-1.5">보완/조언할 점 내역</label>
                 <textarea className="w-full h-28 bg-amber-50/50 border border-amber-100 rounded-lg p-3 text-sm focus:border-amber-400 outline-none resize-none" value={feedbackDraft.improve} onChange={e => setFeedbackDraft({...feedbackDraft, improve: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">선생님 종합 코멘트 (학부모 우송용)</label>
              <textarea className="w-full h-20 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none resize-none" value={feedbackDraft.comment} onChange={e => setFeedbackDraft({...feedbackDraft, comment: e.target.value})} />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">다음 일정 숙제 목록 (줄바꿈 구분)</label>
              <textarea className="w-full h-24 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none resize-none" value={feedbackDraft.homework} onChange={e => setFeedbackDraft({...feedbackDraft, homework: e.target.value})} />
            </div>
          </div>
          
          <div className="h-10"></div> 
        </div>
        
        <div className="absolute bottom-0 right-0 w-full md:w-[55%] bg-white border-t border-gray-200 p-4 px-8 flex justify-end gap-3 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] z-10">
          <button 
             onClick={() => handleSaveAndPublish('reviewing')}
             disabled={isSaving}
             className="px-6 py-3 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            초안 임시 저장 (배포 안함)
          </button>
          <button 
             onClick={() => handleSaveAndPublish('published')}
             disabled={isSaving}
             className="px-6 py-3 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg transition-colors flex items-center gap-2"
          >
            학부모용 결과 링크 최종 발행 (Publish)
          </button>
        </div>
      </div>

    </div>
  );
}
