import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { employees, type Employee } from "@/lib/db/schema";

// 従業員の表示用型（パスワードハッシュを除く）
export type EmployeeDisplay = {
  id: number;
  employeeNumber: string;
  name: string;
  email: string;
  department: string;
  hireDate: string;
  role: "admin" | "employee";
  createdAt: string;
};

// ロールのラベル
export const ROLE_LABELS: Record<Employee["role"], string> = {
  admin: "管理者",
  employee: "一般",
};

/**
 * 全従業員を取得
 */
export async function getAllEmployees(): Promise<EmployeeDisplay[]> {
  const result = await db.query.employees.findMany({
    orderBy: [desc(employees.createdAt)],
  });

  return result.map((employee) => ({
    id: employee.id,
    employeeNumber: employee.employeeNumber,
    name: employee.name,
    email: employee.email,
    department: employee.department,
    hireDate: employee.hireDate,
    role: employee.role,
    createdAt: employee.createdAt,
  }));
}

/**
 * 従業員数を取得
 */
export async function getEmployeeCount(): Promise<number> {
  const result = await db.query.employees.findMany();
  return result.length;
}

/**
 * 部門ごとの従業員数を取得
 */
export async function getEmployeeCountByDepartment(): Promise<
  Record<string, number>
> {
  const result = await db.query.employees.findMany();

  const countByDept: Record<string, number> = {};
  for (const employee of result) {
    countByDept[employee.department] =
      (countByDept[employee.department] || 0) + 1;
  }

  return countByDept;
}
