import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { formatDateJa } from "@/lib/utils";
import {
  getAllEmployees,
  getEmployeeCountByDepartment,
  ROLE_LABELS,
  type EmployeeDisplay,
} from "@/lib/data/employees";

const PAGE_TITLE = "従業員管理";

// ロールに応じたスタイル
const ROLE_STYLES: Record<EmployeeDisplay["role"], string> = {
  admin: "bg-purple-100 text-purple-800",
  employee: "bg-slate-100 text-slate-800",
};

// ロールバッジ
function RoleBadge({ role }: { role: EmployeeDisplay["role"] }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${ROLE_STYLES[role]}`}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

// 従業員行
function EmployeeRow({ employee }: { employee: EmployeeDisplay }) {
  return (
    <tr className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
      <td className="px-4 py-3 text-sm font-medium text-slate-900">
        {employee.employeeNumber}
      </td>
      <td className="px-4 py-3 text-sm text-slate-900">{employee.name}</td>
      <td className="px-4 py-3 text-sm text-slate-600">{employee.email}</td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {employee.department}
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {formatDateJa(employee.hireDate)}
      </td>
      <td className="px-4 py-3">
        <RoleBadge role={employee.role} />
      </td>
    </tr>
  );
}

// 従業員一覧テーブル
function EmployeesTable({ employees }: { employees: EmployeeDisplay[] }) {
  if (employees.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-600">従業員が登録されていません</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
            <th className="px-4 pb-3">社員番号</th>
            <th className="px-4 pb-3">氏名</th>
            <th className="px-4 pb-3">メール</th>
            <th className="px-4 pb-3">部署</th>
            <th className="px-4 pb-3">入社日</th>
            <th className="px-4 pb-3">権限</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <EmployeeRow key={employee.id} employee={employee} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 統計カード
function StatCard({
  label,
  value,
  subLabel,
}: {
  label: string;
  value: number;
  subLabel?: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-4 py-3 text-center">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-600">{label}</p>
      {subLabel && <p className="mt-1 text-xs text-slate-500">{subLabel}</p>}
    </div>
  );
}

// 統計情報
function EmployeeStats({
  employees,
  departmentCounts,
}: {
  employees: EmployeeDisplay[];
  departmentCounts: Record<string, number>;
}) {
  const adminCount = employees.filter((e) => e.role === "admin").length;
  const employeeCount = employees.filter((e) => e.role === "employee").length;
  const departmentCount = Object.keys(departmentCounts).length;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatCard label="総従業員数" value={employees.length} />
      <StatCard label="管理者" value={adminCount} />
      <StatCard label="一般従業員" value={employeeCount} />
      <StatCard label="部署数" value={departmentCount} />
    </div>
  );
}

// 部署別内訳
function DepartmentBreakdown({
  departmentCounts,
}: {
  departmentCounts: Record<string, number>;
}) {
  const sortedDepartments = Object.entries(departmentCounts).sort(
    ([, a], [, b]) => b - a
  );

  if (sortedDepartments.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="mb-3 text-sm font-medium text-slate-700">部署別人数</h3>
      <div className="flex flex-wrap gap-2">
        {sortedDepartments.map(([dept, count]) => (
          <span
            key={dept}
            className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-1 text-sm text-blue-800"
          >
            {dept}
            <span className="ml-2 font-semibold">{count}名</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default async function AdminEmployeesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // 管理者のみアクセス可能
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  // データを並列で取得
  const [employees, departmentCounts] = await Promise.all([
    getAllEmployees(),
    getEmployeeCountByDepartment(),
  ]);

  return (
    <>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{PAGE_TITLE}</h1>
          <p className="mt-1 text-slate-600">
            従業員の一覧と情報を管理できます
          </p>
        </div>
        {/* 将来的に「新規追加」ボタンを追加 */}
      </header>

      <div className="space-y-6">
        {/* 統計情報 */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            従業員サマリー
          </h2>
          <EmployeeStats
            employees={employees}
            departmentCounts={departmentCounts}
          />
          <DepartmentBreakdown departmentCounts={departmentCounts} />
        </section>

        {/* 従業員一覧 */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">従業員一覧</h2>
          </header>
          <div className="p-6">
            <EmployeesTable employees={employees} />
          </div>
        </section>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/dashboard"
          className="text-sm text-slate-600 underline underline-offset-4 hover:text-slate-900"
        >
          ダッシュボードに戻る
        </Link>
      </div>
    </>
  );
}
