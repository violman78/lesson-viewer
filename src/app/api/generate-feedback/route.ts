import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { student_name, instrument, lesson_date, book_unit, piece_title, materials, observation_memo, ai_reference_memo } = data;

    // [중요 로직 1] 분석 대상 검증: 자료나 AI 지시 메모가 하나도 없으면 분석 중단 방어 코드
    if ((!materials || materials.length === 0) && !ai_reference_memo) {
      return NextResponse.json(
        { error: "분석할 자료(materials)나 참고 메모(ai_reference_memo)가 부족하여 AI 분석을 실행할 수 없습니다." }, 
        { status: 400 }
      );
    }

    // [중요 로직 2] 프롬프트 조립 (System Instructions + Context)
    const prompt = `당신은 전문적인 음악 교육 강사입니다. 학부모와 학생에게 전달할 레슨 피드백을 작성해야 합니다.

[레슨 메타데이터]
- 학생명: ${student_name}
- 악기: ${instrument || '미기재'}
- 진도(교재/곡명): ${book_unit || ''} ${piece_title || ''}
- 레슨 날짜: ${lesson_date}

[검토용 원본 소스]
- 업로드된 물리 파일 갯수: ${materials?.length || 0}개
- 선생님의 비밀 관찰 기록: ${observation_memo || '없음'}
- AI 참고/지시사항 메모 (초안 작성 시 1순위 반영 필수!): ${ai_reference_memo || '없음'}

선생님의 지시사항 및 관찰 기록을 분석하여, 학부모가 모바일로 읽기 편한 전문가의 깔끔한 어조로 다음 JSON 구조에 맞춰 한글 코멘트를 생성하세요:

{
  "core": "오늘 레슨의 핵심 요약 한 줄",
  "good": "학생이 지난번보다 잘한 점 칭찬 (2~3문장)",
  "improve": "보완할 점 및 조언 (2~3문장)",
  "comment": "학부모에게 전하는 선생님의 따뜻한 종합 코멘트 (1~2문장)",
  "homework": ["숙제1", "숙제2"] 
}`;

    // [중요 로직 3] Gemini API 호출 (응답을 JSON 형식으로 강제)
    const apiKey = process.env.GEMINI_API_KEY;
    
    // [운영 모드 원칙] Mock 데이터 반환 방식을 전면 패기하고 강제 에러 처리
    if (!apiKey) {
      throw new Error("서버 환경 변수(GEMINI_API_KEY)가 누락되었습니다. 실제 AI 연동 구동을 위해 .env.local에 API 키를 설정해주세요.");
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: "application/json", // 중요: 구조화된 JSON 강제 반환
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
       const text = await response.text();
       throw new Error(`Gemini API 통신 에러: ${text}`);
    }

    const aiRes = await response.json();
    const resultText = aiRes.candidates[0].content.parts[0].text;
    const resultJson = JSON.parse(resultText); 
    
    // [중요 로직 4] JSON 응답 반환
    return NextResponse.json(resultJson);

  } catch (error: any) {
    console.error("AI Generation Error", error);
    return NextResponse.json({ error: error.message || "서버에서 AI 전문을 처리하는 중 오류가 발생했습니다." }, { status: 500 });
  }
}
