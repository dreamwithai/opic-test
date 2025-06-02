import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// 지원하는 질문 타입과 파일명 매핑
const QUESTION_TYPE_FILES: Record<string, string> = {
  '선택주제': 'topic.json',
  '돌발주제': 'combination.json',
  '롤플레이': 'roleplay.json',
  '모의고사': 'mock_test.json'
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionType = searchParams.get('type');
    const theme = searchParams.get('theme');

    if (!questionType) {
      return NextResponse.json(
        { error: 'Question type is required. Use ?type=선택주제 or ?type=돌발주제' },
        { status: 400 }
      );
    }

    const filename = QUESTION_TYPE_FILES[questionType];
    
    if (!filename) {
      return NextResponse.json(
        { error: `Unsupported question type: ${questionType}` },
        { status: 400 }
      );
    }

    // JSON 파일 읽기
    const filePath = path.join(process.cwd(), 'public', 'data', filename);
    
    let jsonData: string;
    
    try {
      jsonData = await fs.readFile(filePath, 'utf8');
    } catch (fileError) {
      return NextResponse.json(
        { error: `Failed to read ${filename}. File may not exist.` },
        { status: 404 }
      );
    }

    const data = JSON.parse(jsonData);
    
    // 특정 테마만 요청된 경우 필터링
    if (theme && data.themes && data.themes[theme]) {
      const filteredData = {
        ...data,
        themes: {
          [theme]: data.themes[theme]
        }
      };
      
      return NextResponse.json(filteredData, {
        headers: {
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        },
      });
    }

    // 전체 데이터 반환
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });

  } catch (error) {
    console.error('Error in questions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST 요청으로 새 질문 데이터 추가 (추후 관리자 기능용)
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인 로직 추가 필요
    return NextResponse.json(
      { error: 'Not implemented yet' },
      { status: 501 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 