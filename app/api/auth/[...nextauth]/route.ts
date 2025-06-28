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
          .select('id, type, email, name, profile_image')
          .eq('provider', provider)
          .eq('provider_id', provider_id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching member:", error);
          return false;
        }

        const email = user.email || null;
        const name = (user && typeof user.name === "string" && user.name.trim() !== "") ? user.name : null;
        const profile_image = user.image || null;

        if (!member) {
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
          const updates: any = {};
          if (member.email !== email) updates.email = email;
          if (member.name !== name) updates.name = name;
          if (member.profile_image !== profile_image) updates.profile_image = profile_image;
          if (Object.keys(updates).length > 0) {
            await supabase.from('members').update(updates).eq('id', member.id);
          }
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