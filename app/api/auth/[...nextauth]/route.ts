import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import KakaoProvider from "next-auth/providers/kakao"
import NaverProvider from "next-auth/providers/naver"
import { supabase } from "@/lib/supabase"
import { AuthOptions } from "next-auth"

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID as string,
      clientSecret: process.env.KAKAO_CLIENT_SECRET as string,
    }),
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID as string,
      clientSecret: process.env.NAVER_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      const provider = account?.provider;
      const provider_id = account?.providerAccountId;

      if (!provider || !provider_id) {
        return false;
      }

      try {
        const { data: member, error } = await supabase
          .from('members')
          .select('id, type')
          .eq('provider', provider)
          .eq('provider_id', provider_id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching member:", error);
          return false;
        }

        if (!member) {
          const email = user.email || null;
          const name =
            (profile && typeof profile.name === "string" && profile.name.trim() !== "")
              ? profile.name
              : (profile && (profile as any).response && typeof (profile as any).response.name === "string" && (profile as any).response.name.trim() !== "")
                ? (profile as any).response.name
                : null;
          const profile_image = user.image || null;
          // console.log('profile:', profile);
          // console.log('DB에 저장할 name:', name);

          const { data: newMember, error: insertError } = await supabase
            .from('members')
            .insert([
              {
                provider,
                provider_id,
                email,
                name,
                profile_image,
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
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };