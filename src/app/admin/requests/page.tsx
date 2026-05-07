import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { formatDateJa } from "@/lib/utils";
import {
  getAllRequestsForAdmin,
  getRequestCountsByStatus,
  LEAVE_TYPE_LABELS,
  STATUS_LABELS,
  type AdminLeaveRequestDisplay,
} from "@/lib/data/leave-balance";

const PAGE_TITLE = "申請承認管理";

// ステータスに応じたスタイル
const STATUS_STYLES: Record<AdminLeaveRequestDisplay["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

// 申請ステータスバッジ
function StatusBadge({
  status,
}: {
  status: AdminLeaveRequestDisplay["status"];
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

// 申請行
function RequestRow({ request }: { request: AdminLeaveRequestDisplay }) {
  return (
    <tr className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
      <td className="px-4 py-3 text-sm text-slate-900">
        <div className="font-medium">{request.employeeName}</div>
        <div className="text-xs text-slate-500">{request.employeeNumber}</div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{request.department}</td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {formatDateJa(request.requestDate)}
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {LEAVE_TYPE_LABELS[request.leaveType]}
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{request.days}日</td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {request.reason || "-"}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={request.status} />
      </td>
      <td className="px-4 py-3">
        {request.status === "pending" && (
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-green-700"
            >
              承認
            </button>
            <button
              type="button"
              className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-red-700"
            >
              却下
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

// 申請一覧テーブル
function RequestsTable({
  requests,
}: {
  requests: AdminLeaveRequestDisplay[];
}) {
  if (requests.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-600">申請がありません</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
            <th className="px-4 pb-3">申請者</th>
            <th className="px-4 pb-3">部署</th>
            <th className="px-4 pb-3">取得希望日</th>
            <th className="px-4 pb-3">種類</th>
            <th className="px-4 pb-3">日数</th>
            <th className="px-4 pb-3">理由</th>
            <th className="px-4 pb-3">ステータス</th>
            <th className="px-4 pb-3">アクション</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <RequestRow key={request.id} request={request} />
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
  bgColor = "bg-slate-50",
  textColor = "text-slate-900",
  labelColor = "text-slate-600",
}: {
  label: string;
  value: number;
  bgColor?: string;
  textColor?: string;
  labelColor?: string;
}) {
  return (
    <div className={`rounded-lg px-4 py-3 text-center ${bgColor}`}>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
      <p className={`text-xs ${labelColor}`}>{label}</p>
    </div>
  );
}

// 統計情報
function RequestStats({
  counts,
}: {
  counts: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatCard label="総申請数" value={counts.total} />
      <StatCard
        label="承認待ち"
        value={counts.pending}
        bgColor="bg-yellow-50"
        textColor="text-yellow-800"
        labelColor="text-yellow-700"
      />
      <StatCard
        label="承認済み"
        value={counts.approved}
        bgColor="bg-green-50"
        textColor="text-green-800"
        labelColor="text-green-700"
      />
      <StatCard
        label="却下"
        value={counts.rejected}
        bgColor="bg-red-50"
        textColor="text-red-800"
        labelColor="text-red-700"
      />
    </div>
  );
}

export default async function AdminRequestsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // 管理者のみアクセス可能
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  // データを並列で取得
  const [requests, counts] = await Promise.all([
    getAllRequestsForAdmin(),
    getRequestCountsByStatus(),
  ]);

  return (
    <>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{PAGE_TITLE}</h1>
          <p className="mt-1 text-slate-600">
            従業員からの有給申請を承認・却下できます
          </p>
        </div>
      </header>

      <div className="space-y-6">
        {/* 統計情報 */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            申請サマリー
          </h2>
          <RequestStats counts={counts} />
        </section>

        {/* 申請一覧 */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">申請一覧</h2>
          </header>
          <div className="p-6">
            <RequestsTable requests={requests} />
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
