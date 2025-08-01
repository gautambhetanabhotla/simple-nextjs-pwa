import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import User from "@/models/user";

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("Please define the NEXTAUTH_SECRET environment variable");
}

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: "Grievance portal",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
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
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
