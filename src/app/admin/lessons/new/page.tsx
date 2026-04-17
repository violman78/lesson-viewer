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
    lessonDate: '', // 서버와의 시간(Hydration) 불일치 에러를 방지하기 위해 초기값을 비웁니다
    bookUnit: '',    
    pieceTitle: ''   
  });

  // Hydration 처리가 끝난 직후 오늘 날짜를 클라이언트 브라우저 기준으로 밀어넣습니다.
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      lessonDate: new Date().toISOString().split('T')[0]
    }));
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
      const { data: newLesson, error: dbError } = await supabase
        .from('lessons')
        .insert({
          share_token: token,
          student_name: formData.studentName,
          instrument: formData.instrument,
          book_unit: formData.bookUnit,
          piece_title: formData.pieceTitle,
          lesson_date: formData.lessonDate, // 명시적 작성된 폼 데이터 전송
          materials: uploadedMaterials, 
          observation_memo: memos.observationMemo, 
          ai_reference_memo: memos.aiReferenceMemo, 
          ai_feedback: {}, 
          status: 'draft' 
        })
        .select()
        .single();

      if (dbError) throw dbError;

      alert('레슨 기록이 성공적으로 저장되었습니다!');
      router.push(`/admin/lessons/${newLesson.id}/review`);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
      setStatusMsg('');
    }
  };

  return (
    <div className="min-h-screen p-6 sm:p-10 bg-gray-50 text-gray-900 font-sans pb-32">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight">새 레슨 기록 등록</h1>
          <p className="text-gray-500 mt-1">오늘 진행한 레슨 기록과 피드백 작성을 위한 자료를 올려주세요.</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-bold border border-red-100">
            [오류] {errorMsg}
          </div>
        )}

        <form onSubmit={handleUploadAndSave} className="space-y-6">
          
          {/* 섹션 1: 기본 정보 */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-gray-800">
               레슨 기본 정보
            </h2>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">학생 이름 <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none" value={formData.studentName} onChange={e => setFormData({...formData, studentName: e.target.value})} required placeholder="예: 김민준" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">레슨 날짜 <span className="text-red-500">*</span></label>
                  <input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none" value={formData.lessonDate} onChange={e => setFormData({...formData, lessonDate: e.target.value})} required />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">악기</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none" value={formData.instrument} onChange={e => setFormData({...formData, instrument: e.target.value})} placeholder="예: 바이올린" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">교재 / 단원</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none" value={formData.bookUnit} onChange={e => setFormData({...formData, bookUnit: e.target.value})} placeholder="예: 스즈키 3권" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">곡명</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none" value={formData.pieceTitle} onChange={e => setFormData({...formData, pieceTitle: e.target.value})} placeholder="예: 가보트" />
                </div>
              </div>
            </div>
          </div>

          {/* 섹션 2: 자료 업로드 */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-gray-800">
               레슨 자료 업로드
            </h2>
            <div className="space-y-6">
              <div className="bg-gray-50 p-5 border border-gray-200 rounded-xl transition-colors hover:bg-gray-100/50">
                 <h3 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">🎼 악보 파일/사진</h3>
                 <p className="text-xs text-gray-500 mb-3">오늘 학습한 악보 원본이나, 학생이 필기한 악보 사진을 올려주세요.</p>
                 <input type="file" multiple accept="image/*,application/pdf" className="text-sm block w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white file:text-gray-700 file:border file:border-gray-300 hover:file:bg-gray-50" onChange={e => setScoreFiles(Array.from(e.target.files || []))} />
              </div>
              
              <div className="bg-gray-50 p-5 border border-gray-200 rounded-xl transition-colors hover:bg-gray-100/50">
                 <h3 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">👀 학생 연주 영상</h3>
                 <p className="text-xs text-gray-500 mb-3">레슨 중 학생이 연주하는 모습을 촬영한 영상을 올려주세요.</p>
                 <input type="file" multiple accept="video/*" className="text-sm block w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white file:text-gray-700 file:border file:border-gray-300 hover:file:bg-gray-50" onChange={e => setStudentVideoFiles(Array.from(e.target.files || []))} />
              </div>

              <div className="bg-gray-50 p-5 border border-gray-200 rounded-xl transition-colors hover:bg-gray-100/50">
                 <h3 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">🎹 선생님 시범 (영상/음원)</h3>
                 <p className="text-xs text-gray-500 mb-3">선생님이 직접 시범을 보여준 연주 영상이나 설명 음성 파일을 올려주세요.</p>
                 <input type="file" multiple accept="video/*,audio/*" className="text-sm block w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white file:text-gray-700 file:border file:border-gray-300 hover:file:bg-gray-50" onChange={e => setTeacherDemoFiles(Array.from(e.target.files || []))} />
              </div>
            </div>
          </div>

          {/* 섹션 3: 레슨 메모 */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-gray-800">
               레슨 메모
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">강사 관찰 메모 (보관용)</label>
                <textarea className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm focus:border-indigo-500 outline-none h-24 placeholder:text-gray-400" placeholder="학부모나 AI에게는 보이지 않는 선생님만의 순수 관찰 기록입니다. 학생의 진도나 특이사항을 편하게 남겨주세요." value={memos.observationMemo} onChange={e => setMemos({...memos, observationMemo: e.target.value})}></textarea>
              </div>
              <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100">
                <label className="block text-sm font-bold mb-2 text-indigo-900">AI 피드백 참고 메모</label>
                <textarea className="w-full bg-white border border-indigo-200 rounded-lg p-4 text-sm focus:border-indigo-500 outline-none h-24 text-gray-800 placeholder:text-indigo-300" placeholder="예: 두 번째 줄 마디 셋잇단음표 리듬감이 아주 좋아졌다고 칭찬해주세요. 다음 주에는 스타카토 연습을 숙제로 내주세요." value={memos.aiReferenceMemo} onChange={e => setMemos({...memos, aiReferenceMemo: e.target.value})}></textarea>
                <p className="text-xs text-indigo-600 mt-2 font-medium">※ 작성하신 메모 내용은 AI가 학부모용 레슨 피드백을 작성할 때 반드시 참고하는 핵심 기준이 됩니다.</p>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full font-bold py-4 rounded-xl text-white transition-all text-lg shadow-md hover:shadow-lg ${isSubmitting ? 'bg-gray-400' : 'bg-gray-900 hover:bg-gray-800'}`}
          >
            {isSubmitting ? statusMsg : '레슨 자료 저장 및 분석 준비'}
          </button>
        </form>

      </div>
    </div>
  );
}
