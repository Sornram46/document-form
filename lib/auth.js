import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
    async redirect({ url, baseUrl }) {
      return baseUrl + "/admin/dashboard";
    }
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/error',
  },
};

// ส่วนของการตรวจสอบ auth ในไฟล์ dashboard.js
useEffect(() => {
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/check-auth');
      if (!res.ok) {
        console.log('Authentication failed:', await res.text());
        // อาจจะไม่ redirect ในช่วงการพัฒนา
        // router.replace('/admin/login');
        return;
      }
      
      fetchRequests();
    } catch (error) {
      console.error('Auth check failed:', error);
      // อาจจะไม่ redirect ในช่วงการพัฒนา
      // router.replace('/admin/login');
    }
  };
  
  checkAuth();
}, []);