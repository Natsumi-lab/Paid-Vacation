import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { formatDateJa } from "@/lib/utils";
import {
  getAllRequestsByEmployeeId,
  LEAVE_TYPE_LABELS,
  STATUS_LABELS,
  type LeaveRequestDisplay,
} from "@/lib/data/leave-balance";

const PAGE_TITLE = "申請一覧";

// ステータスに応じたスタイル
const STATUS_STYLES: Record<LeaveRequestDisplay["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

// 申請ステータスバッジ
function StatusBadge({ status }: { status: LeaveRequestDisplay["status"] }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

// 申請行
function RequestRow({ request }: { request: LeaveRequestDisplay }) {
  return (
    <tr className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
      <td className="px-4 py-3 text-sm text-slate-900">
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
    </tr>
  );
}

// 申請一覧テーブル
function RequestsTable({ requests }: { requests: LeaveRequestDisplay[] }) {
  if (requests.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-600">申請履歴がありません</p>
        <Link
          href="/requests/new"
          className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          最初の申請を作成する
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
            <th className="px-4 pb-3">日付</th>
            <th className="px-4 pb-3">種類</th>
            <th className="px-4 pb-3">日数</th>
            <th className="px-4 pb-3">理由</th>
            <th className="px-4 pb-3">ステータス</th>
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

// 統計情報
function RequestStats({ requests }: { requests: LeaveRequestDisplay[] }) {
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;
  const totalDaysUsed = requests
    .filter((r) => r.status === "approved")
    .reduce((sum, r) => sum + r.days, 0);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div className="rounded-lg bg-slate-50 px-4 py-3 text-center">
        <p className="text-2xl font-bold text-slate-900">{requests.length}</p>
        <p className="text-xs text-slate-600">総申請数</p>
      </div>
      <div className="rounded-lg bg-yellow-50 px-4 py-3 text-center">
        <p className="text-2xl font-bold text-yellow-800">{pendingCount}</p>
        <p className="text-xs text-yellow-700">承認待ち</p>
      </div>
      <div className="rounded-lg bg-green-50 px-4 py-3 text-center">
        <p className="text-2xl font-bold text-green-800">{approvedCount}</p>
        <p className="text-xs text-green-700">承認済み</p>
      </div>
      <div className="rounded-lg bg-blue-50 px-4 py-3 text-center">
        <p className="text-2xl font-bold text-blue-800">{totalDaysUsed}</p>
        <p className="text-xs text-blue-700">使用日数</p>
      </div>
    </div>
  );
}

export default async function RequestsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const employeeId = Number(session.user.id);
  const requests = await getAllRequestsByEmployeeId(employeeId);

  return (
    <>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{PAGE_TITLE}</h1>
          <p className="mt-1 text-slate-600">
            これまでの有給申請履歴を確認できます
          </p>
        </div>
        <Link
          href="/requests/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          新規申請
        </Link>
      </header>

      <div className="space-y-6">
        {/* 統計情報 */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            申請サマリー
          </h2>
          <RequestStats requests={requests} />
        </section>

        {/* 申請一覧 */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">申請履歴</h2>
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
