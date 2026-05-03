import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    employeeNumber: string;
    name: string;
    email: string;
    department: string;
    role: string;
  }

  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    employeeNumber: string;
    department: string;
    role: string;
  }
}
