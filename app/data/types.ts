// OPIc 문제 관련 타입 정의

export interface Question {
  category: "S" | "RP" | "C";  // Self-introduction, Role-play, Combination
  theme: string;               // House, Hobby, Travel, etc.
  q_theme: string;            // 세부 테마
  q_id: number;               // 문제 세트 ID
  q_seq: number;              // 문제 순서 (1, 2, 3...)
  listen: string;             // 음성 파일명
  type: string;               // Description, Habit, Past Experience, etc.
  question: string;           // 영어 문제
  question_kr: string;        // 한국어 문제
  difficulty: number;         // 1-10 난이도 점수
  estimated_time: number;     // 예상 답변 시간(초)
  tags?: string[];           // 추가 태그들
}

// 문제 유형별 JSON 파일 구조 (레벨 구조 제거)
export interface QuestionTypeData {
  questionType: "선택주제" | "롤플레이" | "돌발주제" | "모의고사";
  description: string;
  themes: {
    [themeName: string]: Question[];
  };
}

export interface QuestionSet {
  id: number;
  title: string;
  theme: string;
  questions: Question[];
  description?: string;
}

export interface TestConfig {
  questionTypes: {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    filename: string;  // JSON 파일명
  }[];
  levels: {
    id: "IM2" | "IH" | "AL";
    name: string;
    description: string;
    questionCount: number;
  }[];
  themes: {
    id: string;
    name: string;
    categories: string[];
  }[];
}

export interface UserSelection {
  level: "IM2" | "IH" | "AL";
  questionType: "선택주제" | "롤플레이" | "돌발주제" | "모의고사";
  selectedThemes?: string[];
  questionCount?: number;
} 