import { Question, QuestionSet, UserSelection, TestConfig, QuestionTypeData } from './types';

// 모든 문제 데이터 (실제로는 JSON 파일이나 API에서 가져올 것)
export const allQuestions: Question[] = [
  // House 테마
  {
    category: "S",
    theme: "House",
    q_theme: "House",
    q_id: 1,
    q_seq: 1,
    listen: "house_001_001.mp3",
    type: "Description",
    question: "I would like you to talk about where you live. Describe your house to me. What does it look like? Where is it located?",
    question_kr: "(묘사>집) 당신이 사는 곳에 대해 이야기해 주세요. 당신의 집을 설명해 주세요. 어떻게 생겼나요? 어디 위치해 있나요?",
    difficulty: 3,
    estimated_time: 60,
    tags: ["description", "housing"]
  },
  {
    category: "S",
    theme: "House",
    q_theme: "House", 
    q_id: 1,
    q_seq: 2,
    listen: "house_001_002.mp3",
    type: "Habit",
    question: "Tell me about what you do at home. What activities do you enjoy doing in your house?",
    question_kr: "(습관>집) 집에서 무엇을 하는지 말해주세요. 집에서 어떤 활동을 즐기나요?",
    difficulty: 3,
    estimated_time: 60,
    tags: ["habit", "activities"]
  },
  {
    category: "S",
    theme: "House",
    q_theme: "House",
    q_id: 1,
    q_seq: 3,
    listen: "house_001_003.mp3",
    type: "Past Experience",
    question: "Tell me about a memorable experience you had at your house. What happened and why was it special?",
    question_kr: "(과거경험>집) 집에서 있었던 기억에 남는 경험에 대해 말해주세요. 무슨 일이 있었고 왜 특별했나요?",
    difficulty: 4,
    estimated_time: 90,
    tags: ["past experience", "memory"]
  }
];

// 테스트 설정 - API 엔드포인트 정보 포함
export const testConfig: TestConfig = {
  questionTypes: [
    { 
      id: "선택주제", 
      name: "선택주제", 
      description: "본인이 선택한 주제에 대한 문제", 
      enabled: true,
      filename: "topic.json"
    },
    { 
      id: "롤플레이", 
      name: "롤플레이", 
      description: "상황별 역할 연기 문제", 
      enabled: true,
      filename: "roleplay.json"
    },
    { 
      id: "돌발주제", 
      name: "돌발주제", 
      description: "예상하지 못한 랜덤 주제", 
      enabled: true,
      filename: "combination.json"
    },
    { 
      id: "모의고사", 
      name: "모의고사 1회 테스트", 
      description: "실제 시험과 동일한 형태", 
      enabled: true,
      filename: "mock_test.json"
    }
  ],
  levels: [
    { id: "IM2", name: "IM2 (중급중)", description: "기본적인 의사소통 가능", questionCount: 12 },
    { id: "IH", name: "IH (중급고)", description: "자연스러운 대화 가능", questionCount: 14 },
    { id: "AL", name: "AL (고급)", description: "능숙한 의사소통 가능", questionCount: 15 }
  ],
  themes: [
    { id: "house", name: "집", categories: ["description", "habit", "experience"] },
    { id: "hobby", name: "취미", categories: ["description", "habit", "experience"] },
    { id: "travel", name: "여행", categories: ["description", "experience", "preference"] },
    { id: "work", name: "직장/학교", categories: ["description", "routine", "experience"] },
    { id: "food", name: "음식", categories: ["preference", "habit", "culture"] }
  ]
};

// 샘플 데이터 구조 - topic.json 예시 (레벨 구조 제거)
export const sampleTopicData: QuestionTypeData = {
  questionType: "선택주제",
  description: "본인이 선택한 주제에 대한 문제입니다.",
  themes: {
    House: [
      {
        category: "S",
        theme: "House",
        q_theme: "House",
        q_id: 1,
        q_seq: 1,
        listen: "house_001_001.mp3",
        type: "Description",
        question: "I would like you to talk about where you live. Describe your house to me. What does it look like? Where is it located?",
        question_kr: "(묘사>집) 당신이 사는 곳에 대해 이야기해 주세요. 당신의 집을 설명해 주세요. 어떻게 생겼나요? 어디 위치해 있나요?",
        difficulty: 3,
        estimated_time: 60,
        tags: ["description", "housing"]
      },
      {
        category: "S",
        theme: "House",
        q_theme: "House", 
        q_id: 1,
        q_seq: 2,
        listen: "house_001_002.mp3",
        type: "Habit",
        question: "Tell me about what you do at home. What activities do you enjoy doing in your house?",
        question_kr: "(습관>집) 집에서 무엇을 하는지 말해주세요. 집에서 어떤 활동을 즐기나요?",
        difficulty: 3,
        estimated_time: 60,
        tags: ["habit", "activities"]
      },
      {
        category: "S",
        theme: "House",
        q_theme: "House",
        q_id: 1,
        q_seq: 3,
        listen: "house_001_003.mp3",
        type: "Past Experience",
        question: "Tell me about a memorable experience you had at your house. What happened and why was it special?",
        question_kr: "(과거경험>집) 집에서 있었던 기억에 남는 경험에 대해 말해주세요. 무슨 일이 있었고 왜 특별했나요?",
        difficulty: 4,
        estimated_time: 90,
        tags: ["past experience", "memory"]
      }
    ],
    Hobby: [
      {
        category: "S",
        theme: "Hobby",
        q_theme: "Hobby",
        q_id: 2,
        q_seq: 1,
        listen: "hobby_002_001.mp3",
        type: "Description",
        question: "Tell me about your hobbies. What do you like to do in your free time?",
        question_kr: "(묘사>취미) 당신의 취미에 대해 말해주세요. 여가 시간에 무엇을 하는 것을 좋아하나요?",
        difficulty: 3,
        estimated_time: 60,
        tags: ["description", "hobby"]
      },
      {
        category: "S",
        theme: "Hobby",
        q_theme: "Hobby",
        q_id: 2,
        q_seq: 2,
        listen: "hobby_002_002.mp3",
        type: "Habit",
        question: "How often do you do your hobbies? When do you usually engage in these activities?",
        question_kr: "(습관>취미) 얼마나 자주 취미활동을 하나요? 보통 언제 이런 활동을 하나요?",
        difficulty: 3,
        estimated_time: 60,
        tags: ["habit", "frequency"]
      },
      {
        category: "S",
        theme: "Hobby",
        q_theme: "Hobby",
        q_id: 2,
        q_seq: 3,
        listen: "hobby_002_003.mp3",
        type: "Past Experience",
        question: "Tell me about a memorable experience related to your hobby. What happened and why was it special?",
        question_kr: "(과거경험>취미) 취미와 관련된 기억에 남는 경험에 대해 말해주세요. 무슨 일이 있었고 왜 특별했나요?",
        difficulty: 4,
        estimated_time: 90,
        tags: ["past experience", "memory"]
      }
    ]
  }
};

// 유틸리티 함수들
export class QuestionManager {
  private static questionCache: Map<string, QuestionTypeData> = new Map();

  // API에서 문제 데이터 로드 (JSON 파일 직접 접근 대신 API 사용)
  static async loadQuestionData(questionType: string): Promise<QuestionTypeData | null> {
    try {
      // 캐시 확인
      if (this.questionCache.has(questionType)) {
        return this.questionCache.get(questionType)!;
      }

      const config = testConfig.questionTypes.find(qt => qt.id === questionType);
      if (!config) {
        throw new Error(`Question type ${questionType} not found`);
      }

      // API 호출로 변경 (/data/ 직접 접근 대신 /api/questions 사용)
      const response = await fetch(`/api/questions?type=${encodeURIComponent(questionType)}`);
      if (!response.ok) {
        throw new Error(`Failed to load ${questionType} data: ${response.status} ${response.statusText}`);
      }

      const data: QuestionTypeData = await response.json();
      
      // 캐시에 저장
      this.questionCache.set(questionType, data);
      
      return data;
    } catch (error) {
      console.error(`Error loading question data for ${questionType}:`, error);
      
      // 폴백: 샘플 데이터 사용 (선택주제의 경우)
      if (questionType === "선택주제") {
        return sampleTopicData;
      }
      
      return null;
    }
  }

  // 사용자 선택에 따른 문제 필터링
  static async getQuestionsBySelection(selection: UserSelection): Promise<Question[]> {
    const questionData = await this.loadQuestionData(selection.questionType);
    if (!questionData) return [];

    let questions: Question[] = [];

    if (selection.selectedThemes && selection.selectedThemes.length > 0) {
      // 선택된 테마의 문제만 가져오기
      for (const theme of selection.selectedThemes) {
        if (questionData.themes[theme]) {
          questions.push(...questionData.themes[theme]);
        }
      }
    } else {
      // 모든 테마의 문제 가져오기
      Object.values(questionData.themes).forEach(themeQuestions => {
        questions.push(...themeQuestions);
      });
    }

    return questions;
  }

  // 문제 세트 생성 (연속된 문제들을 그룹화)
  static createQuestionSets(questions: Question[]): QuestionSet[] {
    const sets = new Map<string, Question[]>();
    
    questions.forEach(q => {
      const key = `${q.theme}_${q.q_id}`;
      if (!sets.has(key)) {
        sets.set(key, []);
      }
      sets.get(key)!.push(q);
    });

    return Array.from(sets.entries()).map(([key, questions], index) => {
      questions.sort((a, b) => a.q_seq - b.q_seq);
      return {
        id: index + 1,
        title: `${questions[0].theme} 문제 세트`,
        theme: questions[0].theme,
        questions
      };
    });
  }

  // 특정 문제 유형의 테마 목록 가져오기
  static async getAvailableThemes(questionType: string): Promise<string[]> {
    const questionData = await this.loadQuestionData(questionType);
    if (!questionData) return [];

    return Object.keys(questionData.themes);
  }

  // 문제 개수 확인
  static async getQuestionCount(questionType: string, theme?: string): Promise<number> {
    const questionData = await this.loadQuestionData(questionType);
    if (!questionData) return 0;

    if (theme && questionData.themes[theme]) {
      return questionData.themes[theme].length;
    }

    // 전체 문제 개수
    return Object.values(questionData.themes)
      .reduce((total, questions) => total + questions.length, 0);
  }

  // 랜덤 문제 선택
  static async getRandomQuestions(
    questionType: string, 
    count: number
  ): Promise<Question[]> {
    const selection: UserSelection = { 
      level: "IM2", // 레벨은 더미값 (실제로는 사용되지 않음)
      questionType: questionType as any 
    };
    const allQuestions = await this.getQuestionsBySelection(selection);
    
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}

// 데이터 로딩 함수 (추후 API 연결시 사용)
export async function loadQuestionsFromAPI(): Promise<Question[]> {
  try {
    // 실제 API 호출 또는 JSON 파일 로딩
    const response = await fetch('/api/questions');
    return await response.json();
  } catch (error) {
    console.error('Failed to load questions:', error);
    return allQuestions; // 폴백으로 하드코딩된 데이터 사용
  }
}

// 음성 파일 경로 생성
export function getAudioPath(filename: string): string {
  return `/audio/${filename}`;
}

// JSON 파일 생성을 위한 헬퍼 함수들
export function generateTopicJSON(): QuestionTypeData {
  return sampleTopicData;
}

export function generateEmptyQuestionTypeData(questionType: "선택주제" | "롤플레이" | "돌발주제" | "모의고사"): QuestionTypeData {
  return {
    questionType,
    description: `${questionType} 문제입니다.`,
    themes: {}
  };
} 