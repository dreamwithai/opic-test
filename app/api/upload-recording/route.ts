import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
      console.warn(`Upload operation failed (attempt ${i + 1}/${maxRetries}):`, error);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError!;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Upload recording API called')
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const memberId = formData.get('memberId') as string
    const fileName = formData.get('fileName') as string

    console.log('Upload params:', { memberId, fileName, fileSize: file?.size })

    if (!file || !memberId || !fileName) {
      console.error('Missing required fields:', { hasFile: !!file, hasMemberId: !!memberId, hasFileName: !!fileName })
      return NextResponse.json({ 
        error: 'File, memberId, and fileName are required' 
      }, { status: 400 })
    }

    // 파일을 ArrayBuffer로 변환
    console.log('Converting file to ArrayBuffer...')
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    console.log('File converted, size:', uint8Array.length)

    // 24시간 후 만료 시간 설정
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    // temp 폴더가 존재하는지 확인하고 없으면 생성
    const tempFolderPath = `temp/${memberId}`
    console.log('Checking temp folder...')
    const { data: folderCheck, error: folderError } = await supabase.storage
      .from('recordings')
      .list('temp')
    
    if (folderError) {
      console.error('Folder check error:', folderError)
    }
    
    console.log('Folder check result:', folderCheck)
    
    if (!folderCheck || folderCheck.length === 0) {
      console.log('Creating temp folder...')
      // temp 폴더가 없으면 빈 파일을 업로드하여 폴더 생성
      const { error: keepError } = await supabase.storage
        .from('recordings')
        .upload('temp/.keep', new Uint8Array(0), {
          contentType: 'application/octet-stream'
        })
      
      if (keepError) {
        console.error('Error creating temp folder:', keepError)
      } else {
        console.log('Temp folder created successfully')
      }
    }

    // 파일 확장자를 기반으로 MIME 타입 결정
    const getContentType = (filename: string): string => {
      const extension = filename.toLowerCase().split('.').pop()
      switch (extension) {
        case 'webm':
          return 'audio/webm'
        case 'wav':
          return 'audio/wav'
        case 'mp3':
          return 'audio/mpeg'
        case 'm4a':
          return 'audio/mp4'
        case 'ogg':
          return 'audio/ogg'
        default:
          return 'audio/webm' // 기본값
      }
    }

    const contentType = getContentType(fileName)
    console.log('Determined content type:', contentType, 'for file:', fileName)

    // Supabase Storage에 temp 폴더에 업로드
    console.log('Uploading file to:', `${tempFolderPath}/${fileName}`)
    
    let data, error;
    try {
      const result = await retryOperation(async () => {
        const result = await supabase.storage
          .from('recordings')
          .upload(`${tempFolderPath}/${fileName}`, uint8Array, {
            contentType: contentType,
            upsert: true,
            metadata: {
              status: 'temp',
              expires_at: expiresAt,
              original_type: file.type, // 원본 파일 타입도 저장
              detected_type: contentType // 감지된 타입도 저장
            }
          })
        
        if (result.error) throw result.error;
        return result;
      });
      data = result.data;
      error = result.error;
    } catch (err) {
      error = err as any;
    }

    if (error) {
      console.error('Storage upload error:', error)
      return NextResponse.json({ error: error?.message || 'Upload failed' }, { status: 500 })
    }

    console.log('Upload successful:', data?.path)
    
    const relativePath = `${memberId}/${fileName}`;

    // 업로드 후 실제로 파일이 저장되었는지 확인
    const { data: fileCheck, error: fileCheckError } = await supabase.storage
      .from('recordings')
      .list(`temp/${memberId}`)
    
    if (fileCheckError) {
      console.error('File check error:', fileCheckError)
    } else {
      console.log('Files in user folder:', fileCheck)
    }
    
    return NextResponse.json({ 
      success: true, 
      path: relativePath
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 })
  }
} 