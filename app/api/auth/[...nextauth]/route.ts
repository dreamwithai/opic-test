import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import KakaoProvider from "next-auth/providers/kakao"
import NaverProvider from "next-auth/providers/naver"
import { supabase } from "@/lib/supabase"
import { AuthOptions } from "next-auth"

const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID || "",
      clientSecret: process.env.KAKAO_CLIENT_SECRET || "",
    }),
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID || "",
      clientSecret: process.env.NAVER_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) {
        return false;
      }
      try {
        const { data: member, error } = await supabase
          .from('members')
          .select('id, type')
          .eq('email', user.email)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching member:", error);
          return false;
        }

        if (!member) {
          const { data: newMember, error: insertError } = await supabase
            .from('members')
            .insert([
              {
                email: user.email,
                name: user.name,
                provider: account?.provider,
                type: 'user',
              },
            ])
            .select('id, type')
            .single();

          if (insertError) {
            console.error("Error inserting new member:", insertError);
            return false;
          }
          user.id = newMember.id;
          (user as any).type = newMember.type;
        } else {
          user.id = member.id;
          (user as any).type = member.type;
        }
        return true;
      } catch (e) {
        console.error("Sign in callback error", e);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.type = (user as any).type;
      }
      return token;
    },
    async session({ session, token }) {
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
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };