import { redirect } from 'next/navigation';

export default function RootPage() {
  // 사용자가 token 없이 원본 루트 도메인 (share.coop-hyosung.com 등)으로 잘못 들어온 경우
  // 기본 Next.js 로고 화면이 뜨지 않도록 바로 메인 홈페이지로 강제 리다이렉트 시킵니다.
  redirect('https://coop-hyosung.com');
}
