import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 재시도 로직을 위한 헬퍼 함수
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Operation failed (attempt ${i + 1}/${maxRetries}):`, error);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError!;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Save session API called')
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error('No session or user ID')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User ID:', session.user.id)

    const body = await request.json()
    const { 
      sessionData, 
      answersData, 
      recordingFiles 
    } = body

    console.log('Request body:', { 
      sessionData: !!sessionData, 
      answersDataLength: answersData?.length, 
      recordingFilesLength: recordingFiles?.length 
    })

    if (!sessionData || !answersData || !recordingFiles) {
      console.error('Missing required data')
      return NextResponse.json({ 
        error: 'Session data, answers data, and recording files are required' 
      }, { status: 400 })
    }

    // 1. temp 파일들을 permanent 폴더로 이동 (MIME 타입 교정 포함)
    console.log('Moving files from temp to permanent with MIME type correction...')
    for (const file of recordingFiles) {
      if (file.path) {
        const tempPath = `temp/${file.path}`
        const permanentPath = `permanent/${file.path}`
        
        console.log(`Processing file: from ${tempPath} to ${permanentPath}`)

        try {
          // 재시도 로직으로 파일 다운로드
          const { data: blob, error: downloadError } = await retryOperation(async () => {
            const result = await supabase.storage
              .from('recordings')
              .download(tempPath)
            
            if (result.error) throw result.error;
            return result;
          });
          
          if (downloadError) {
            console.error(`Download failed for ${tempPath}:`, downloadError)
            continue; // 이 파일은 건너뛰고 다음 파일 처리
          }

          // 재시도 로직으로 파일 업로드
          const { error: uploadError } = await retryOperation(async () => {
            const result = await supabase.storage
              .from('recordings')
              .upload(permanentPath, blob, {
                contentType: 'audio/webm',
                upsert: true, // 이미 파일이 있다면 덮어쓰기
              })
            
            if (result.error) throw result.error;
            return result;
          });

          if (uploadError) {
            console.error(`Re-upload failed for ${permanentPath}:`, uploadError)
            continue; // 이 파일은 건너뛰고 다음 파일 처리
          }
          
          console.log(`File successfully moved and corrected: ${permanentPath}`)

          // 재시도 로직으로 temp 파일 삭제
          const { error: removeError } = await retryOperation(async () => {
            const result = await supabase.storage
              .from('recordings')
              .remove([tempPath])
            
            if (result.error) throw result.error;
            return result;
          });
          
          if (removeError) {
            console.error(`Failed to remove temp file ${tempPath}:`, removeError)
            // 삭제 실패는 치명적이지 않으므로 로그만 남기고 계속 진행
          }
        } catch (error) {
          console.error(`Failed to process file ${tempPath}:`, error)
          continue; // 이 파일은 건너뛰고 다음 파일 처리
        }
      }
    }

    // 2. test_session에 저장
    console.log('Saving to test_session...')
    let sessionResult: any, sessionError: any;
    try {
      const result = await retryOperation(async () => {
        const result = await supabase
          .from('test_session')
          .insert([{
            member_id: session.user.id,
            type: sessionData.type,
            theme: sessionData.theme,
            level: sessionData.level,
            first_answer: sessionData.first_answer,
            first_feedback: sessionData.first_feedback
          }])
          .select('id')
          .single()
        
        if (result.error) throw result.error;
        return result;
      });
      sessionResult = result.data;
      sessionError = result.error;
    } catch (error) {
      sessionError = error as any;
    }

    if (sessionError || !sessionResult) {
      console.error('Session save error:', sessionError)
      return NextResponse.json({ 
        error: 'Session save failed: ' + (sessionError?.message || 'Unknown error') 
      }, { status: 500 })
    }

    console.log('Session saved with ID:', sessionResult.id)

    // 3. test_answers에 저장 (녹음 파일 URL 포함)
    console.log('Saving answers...')
    const answersToInsert = answersData.map((answer: any) => {
      // answer.answer_url은 이제 'USER_ID/FILENAME.webm' 형태의 상대 경로
      const permanentPath = answer.answer_url ? `permanent/${answer.answer_url}` : null;
      
      return {
        session_id: sessionResult.id,
        q_id: answer.q_id,
        q_seq: answer.q_seq,
        answer_text: answer.answer_text,
        answer_url: permanentPath, // 'permanent/USER_ID/FILENAME.webm' 저장
        feedback: answer.feedback
      };
    });

    console.log('Answers to insert:', answersToInsert.length);
    console.log('Sample answer to insert:', answersToInsert[0]);

    let answersError;
    try {
      const result = await retryOperation(async () => {
        const result = await supabase
          .from('test_answers')
          .insert(answersToInsert)
        
        if (result.error) throw result.error;
        return result;
      });
      answersError = result.error;
    } catch (error) {
      answersError = error as any;
    }

    if (answersError) {
      console.error('Answers save error:', answersError)
      return NextResponse.json({ 
        error: 'Answers save failed: ' + (answersError?.message || 'Unknown error') 
      }, { status: 500 })
    }

    console.log('All data saved successfully')
    return NextResponse.json({ 
      success: true, 
      sessionId: sessionResult.id,
      savedAnswers: answersToInsert.length
    })

  } catch (error) {
    console.error('Save session error:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 })
  }
} 