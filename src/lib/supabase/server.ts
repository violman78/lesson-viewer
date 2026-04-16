import { createClient } from '@supabase/supabase-js';

// 서버에서만 실행되도록 설계된 클라이언트
// 보안을 위해 서비스 롤 키(Service Role Key)를 지원하며 세션 유지 기능(persistance)을 끕니다.
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  // 서버 클라이언트는 일반적으로 서비스 단위 접근이므로 Service Role Key 사용 가능 (없으면 익명 키로 폴백)
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false, // 서버 측에서는 불필요한 쿠키/로컬 스토리지 사용 방지
    },
  });
};
