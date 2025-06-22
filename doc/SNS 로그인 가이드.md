# Next.js, NextAuth, Supabase를 이용한 SNS 로그인 연동 가이드

## 1. 프로젝트 목표

Next.js 환경에서 NextAuth를 사용하여 다양한 SNS(Google, Kakao, Naver 등) 로그인을 구현하고, 인증된 사용자 정보를 Supabase 데이터베이스에 저장 및 관리하는 것을 목표로 합니다.

## 2. 초기 접근 방식과 문제점

### A. `@next-auth/supabase-adapter` 사용

가장 먼저 공식적으로 지원되는 Supabase 어댑터를 사용하여 연동을 시도했습니다. 이 방법은 이론적으로 가장 간단해 보였습니다.

-   **문제점**:
    -   어댑터는 NextAuth의 세션, 사용자 정보 등을 Supabase의 `public` 스키마에 자동으로 테이블을 생성하여 관리합니다.
    -   하지만 Supabase의 RLS(Row Level Security) 정책, 특히 `auth` 스키마에 대한 접근 제어와 충돌하는 문제가 발생했습니다.
    -   로그인 및 회원가입은 정상적으로 이루어졌지만, 이후 RLS가 적용된 테이블(예: `test_session`)에 데이터를 삽입하려고 할 때 지속적으로 권한 오류가 발생했습니다.
    -   RLS 정책을 수정하여 해결을 시도했으나, 복잡성이 증가하고 보안에 허점이 생길 우려가 있었습니다.

### B. 수동 JWT 생성 및 관리

어댑터 방식의 문제를 해결하기 위해, NextAuth의 `jwt` 세션 전략을 사용하면서 로그인 성공 시 Supabase 접근을 위한 JWT를 수동으로 생성하여 클라이언트에 전달하는 방식을 고려했습니다.

-   **문제점**:
    -   NextAuth가 관리하는 세션과 별개로 Supabase용 JWT를 관리해야 하므로 인증 로직이 복잡해집니다.
    -   두 토큰의 만료 시간을 동기화하는 등 세션 관리가 까다로워집니다.
    -   결정적으로, 클라이언트 측에서 Supabase에 직접 접근하는 방식은 여전히 RLS 정책 문제로부터 자유롭지 못했습니다.

## 3. 최종 해결책: 역할 분리를 통한 접근

여러 시행착오 끝에, **인증**과 **데이터 처리**의 역할을 명확히 분리하는 방식으로 최종 아키텍처를 결정했습니다.

### A. 아키텍처 요약

1.  **인증 (Frontend)**: NextAuth는 순수하게 SNS 인증 및 세션 관리 역할만 담당합니다. (어댑터 사용 X)
2.  **데이터 처리 (Backend)**: 사용자의 DB 작업(설문 저장, 테스트 결과 저장, 파일 업로드 등)은 Next.js의 **API Route**를 통해 처리합니다.
3.  **권한 관리**: API Route에서는 클라이언트의 요청을 받아, Supabase의 **`service_role_key`**를 사용하여 DB 작업을 수행합니다.

### B. 왜 이 방식이 효과적인가?

-   **보안**: `service_role_key`는 서버 측(API Route)에서만 사용되므로 클라이언트에 노출될 위험이 없습니다.
-   **RLS 우회**: `service_role_key`는 Supabase의 모든 RLS 정책을 우회하는 강력한 권한을 가집니다. 따라서 복잡한 RLS 정책을 수정할 필요 없이, 서버에서 안전하게 데이터를 읽고 쓸 수 있습니다.
-   **역할 분리**: 프론트엔드는 사용자 인증과 UI에만 집중하고, 데이터베이스와의 모든 상호작용은 백엔드 API를 통해 이루어지므로 코드 구조가 명확해지고 유지보수가 용이해집니다.
-   **단순함**: NextAuth는 가장 기본적인 `jwt` 세션 전략을 그대로 사용하므로 설정이 복잡하지 않습니다.

### C. 주요 코드 예시

#### `app/api/auth/[...nextauth]/route.ts` (인증 담당)

NextAuth 설정은 일반적인 JWT 세션 방식을 따릅니다. `callbacks`에서 세션 객체에 사용자 ID를 추가하여 클라이언트에서 사용할 수 있도록 합니다.

```typescript
// ...
import { authOptions } from '../auth/[...nextauth]/route'
// ...

export const authOptions: NextAuthOptions = {
  providers: [
    // Google, Kakao, Naver 등 Provider 설정
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  // ...
};
```

#### `app/api/save-session/route.ts` (데이터 처리 담당)

클라이언트로부터 요청을 받으면, `service_role_key`를 사용하여 Supabase 클라이언트를 초기화하고 DB 작업을 수행합니다.

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

// service_role_key를 사용하여 Supabase 클라이언트 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  // 1. 서버 측에서 세션을 확인하여 인증된 사용자인지 검증
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json();
  
  // 2. RLS 정책 걱정 없이 DB 작업 수행
  const { data, error } = await supabase
    .from('test_session')
    .insert([{ member_id: session.user.id, ...body.sessionData }])
    .select('id')
    .single();

  if (error) {
    // ... 에러 처리
  }

  // ... 추가적인 DB 작업 수행

  return NextResponse.json({ success: true, sessionId: data.id });
}
```

## 4. 결론

NextAuth와 Supabase를 연동할 때, `supabase-adapter`는 RLS 정책과 충돌하여 예상치 못한 문제를 일으킬 수 있습니다.

**인증은 NextAuth**에, **DB 작업은 `service_role_key`를 사용하는 API Route**에 위임하는 역할 분리 아키텍처는 Supabase의 강력한 보안 기능을 유지하면서도 안정적이고 유연하게 애플리케이션을 개발할 수 있는 매우 효과적인 해결책입니다.

---

## 5. 파일 업로드 및 관리 (Supabase Storage)

인증뿐만 아니라 사용자가 생성하는 파일(녹음, 이미지 등)을 Supabase Storage에 업로드하고 관리하는 과정에서도 비슷한 권한 문제가 발생합니다.

### A. 문제점: 클라이언트 측 직접 업로드의 한계

-   클라이언트(브라우저)에서 `anon_key`를 사용하여 Supabase Storage에 직접 파일을 업로드하는 것은 공개(public) 버킷이 아니라면 RLS 정책 때문에 기본적으로 차단됩니다.
-   특히, "인증된 사용자만 업로드 가능"과 같은 정책을 적용하더라도, 파일 이동이나 특정 폴더(예: `permanent`)로의 접근을 제어하기가 까다롭고 복잡한 RLS 정책을 요구합니다.

### B. 해결책: 서버 사이드 처리와 Temp/Permanent 폴더 전략

인증 문제와 마찬가지로, 파일 처리 역시 모든 로직을 서버(API Route)로 옮겨서 해결했습니다.

1.  **Temp / Permanent 폴더 전략**:
    -   **`temp` 폴더**: 사용자가 녹음이나 파일 선택을 완료하면, 파일은 일단 임시 저장소인 `temp` 폴더에 업로드됩니다. 이 파일들은 TTL(Time-To-Live)을 설정하여 일정 시간(예: 24시간) 후 자동으로 삭제되도록 관리할 수 있습니다.
    -   **`permanent` 폴더**: 사용자가 최종적으로 "저장하기", "제출하기" 등의 액션을 취했을 때만, 서버는 `temp` 폴더의 파일을 `permanent` 폴더로 이동시키고 데이터베이스에 파일 경로를 기록합니다.
    -   **장점**: 사용자가 중간에 이탈하더라도 불필요한 파일이 영구 저장소에 남지 않아 스토리지 낭비를 막고, 관리가 용이해집니다.

2.  **`service_role_key`를 사용한 서버 사이드 처리**:
    -   파일 업로드, 이동, 삭제 등 Storage와 관련된 모든 작업은 API Route를 통해 이루어집니다.
    -   API Route에서는 `service_role_key`로 초기화된 Supabase 클라이언트를 사용하므로, RLS 정책에 구애받지 않고 자유롭게 파일을 처리할 수 있습니다.

### C. 주요 코드 예시

#### `app/api/upload-recording/route.ts` (임시 파일 업로드)

클라이언트로부터 파일과 사용자 정보를 받아 `temp` 폴더에 업로드합니다.

```typescript
// ... (imports)

// service_role_key 사용
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const memberId = formData.get('memberId') as string;
  // ...

  // 'temp/사용자ID/파일명' 경로로 업로드
  const filePath = `temp/${memberId}/${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('recordings')
    .upload(filePath, file);
  
  // ... (에러 처리 및 결과 반환)
}
```

#### `app/api/save-session/route.ts` (파일 이동 및 최종 저장)

최종 저장 요청이 오면, `temp` 폴더의 파일을 `permanent` 폴더로 이동시킵니다.

```typescript
// ... (imports)

// service_role_key 사용
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  // ... (세션 검증)

  const { recordingFiles } = await request.json();

  for (const file of recordingFiles) {
    const tempPath = `temp/${file.path}`;
    const permanentPath = `permanent/${file.path}`;
    
    // RLS 제약 없이 파일 이동
    await supabase.storage
      .from('recordings')
      .move(tempPath, permanentPath);
  }
  
  // ... (DB에 permanentPath 정보 저장)

  return NextResponse.json({ success: true });
}
```

### D. 결론

Supabase Storage를 사용할 때도, **모든 파일 조작 로직을 `service_role_key`를 사용하는 API Route로 옮기는 것**이 가장 안정적이고 보안적으로 뛰어난 방법입니다. `Temp/Permanent` 폴더 전략을 함께 사용하면 스토리지 관리 효율성까지 높일 수 있습니다. 