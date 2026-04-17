import { createBrowserSupabaseClient } from './client';

const STORAGE_BUCKET = 'materials';

// 명시적인 자료 종류 정의
export type MaterialType = 'score' | 'student_video' | 'teacher_demo';

export type FileUploadTask = {
  file: File;
  materialType: MaterialType;
};

export async function uploadMaterials(tasks: FileUploadTask[], folderPath: string) {
  const supabase = createBrowserSupabaseClient();
  const uploadResults = [];

  for (const task of tasks) {
    const { file, materialType } = task;
    
    // 파일명 인코딩 및 폴더경로 할당
    const uniqueFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    const filePath = `${folderPath}/${materialType}/${uniqueFileName}`; // 폴더 내부에서도 타입별로 분류 저장

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error(`[${materialType}] 파일 업로드 실패 (${file.name}):`, error);
      throw new Error(`[${materialType}] 파일 업로드 중 오류가 발생했습니다: ${error.message}`);
    }

    // 업로드 성공 후 Public URL 추출
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    uploadResults.push({
      originalName: file.name,
      path: data.path,
      url: publicUrlData.publicUrl,
      // 자동 추론 단계를 삭제하고 명시적 타입 할당을 보장함
      type: materialType 
    });
  }

  return uploadResults;
}
