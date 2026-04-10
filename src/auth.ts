import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { employees } from "@/lib/db/schema";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        employeeNumber: { label: "社員番号", type: "text" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.employeeNumber || !credentials?.password) {
          return null;
        }

        const employeeNumber = credentials.employeeNumber as string;
        const password = credentials.password as string;

        const employee = await db.query.employees.findFirst({
          where: eq(employees.employeeNumber, employeeNumber),
        });

        if (!employee) {
          return null;
        }

        const isPasswordValid = await compare(password, employee.passwordHash);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: String(employee.id),
          employeeNumber: employee.employeeNumber,
          name: employee.name,
          email: employee.email,
          department: employee.department,
          role: employee.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.employeeNumber = user.employeeNumber;
        token.department = user.department;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.employeeNumber = token.employeeNumber as string;
        session.user.department = token.department as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
