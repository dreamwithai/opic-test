import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import KakaoProvider from "next-auth/providers/kakao"
import NaverProvider from "next-auth/providers/naver"
import { supabase } from "@/lib/supabase"
import { AuthOptions } from "next-auth"

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID!,
      clientSecret: process.env.NAVER_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) {
        console.error("Email not found in user profile");
        return false;
      }

      try {
        // 1. 소셜 로그인 사용자가 DB에 있는지 확인
        let { data: member, error } = await supabase
          .from('members')
          .select('*')
          .eq('email', user.email)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116: 'exact one row' 에러는 없는 경우이므로 무시
          console.error("Error fetching member:", error);
          return false; // DB 에러 시 로그인 실패
        }

        // 2. DB에 없으면 새로 추가
        if (!member) {
          const { data: newMember, error: insertError } = await supabase
            .from('members')
            .insert([
              {
                email: user.email,
                name: user.name,
                provider: account?.provider, // 'google', 'kakao', 'naver'
                type: 'user', // 기본 타입
              },
            ])
            .select()
            .single();

          if (insertError) {
            console.error("Error inserting new member:", insertError);
            return false; // 회원가입 실패 시 로그인 실패
          }
          member = newMember;
        }

        // 3. user 객체에 우리 DB의 id와 type을 추가 (이후 콜백에서 사용)
        user.id = member.id;
        user.type = member.type;
        return true; // 로그인 성공

      } catch (e) {
        console.error("Sign in callback error", e);
        return false;
      }
    },
    async jwt({ token, user }) {
      // signIn 콜백에서 넘겨준 user 정보를 token에 담기
      if (user) {
        token.id = user.id;
        token.type = user.type;
      }
      return token;
    },
    async session({ session, token }) {
      // jwt 콜백에서 token에 담은 정보를 session.user에 담기
      if (session.user) {
        session.user.id = token.id as string;
        session.user.type = token.type as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST } 