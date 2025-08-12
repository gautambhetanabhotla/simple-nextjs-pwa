import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import User from "@/models/user";
import connectToDatabase from "@/lib/mongodb";

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("Please define the NEXTAUTH_SECRET environment variable");
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Grievance portal",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectToDatabase();
        const user = await User.findOne({ email: credentials!.email });
        if (!user) {
          throw new Error("No user found with the given email");
        }
        const isValid = await compare(credentials!.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Invalid password");
        }
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // When user signs in, add user data to token
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.image as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // in seconds
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
});

export { handler as GET, handler as POST };
