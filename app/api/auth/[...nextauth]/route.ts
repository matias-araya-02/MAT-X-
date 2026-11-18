import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const adminEmail = process.env.ADMIN_EMAIL
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH

        if (!adminEmail || !adminPasswordHash) {
          return null
        }

        if (credentials.email !== adminEmail) {
          return null
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          adminPasswordHash
        )

        if (!passwordMatch) return null

        return { id: '1', email: adminEmail, name: 'Admin' }
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 8, // 8 horas
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.email = user.email
      return token
    },
    async session({ session, token }) {
      if (token) session.user = { email: token.email as string }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
