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
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
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
