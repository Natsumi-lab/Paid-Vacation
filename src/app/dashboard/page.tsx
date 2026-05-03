import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { formatDateJa } from "@/lib/utils";
import {
  getLeaveBalanceByEmployeeId,
  getRecentRequestsByEmployeeId,
  getPendingRequestCount,
  LEAVE_TYPE_LABELS,
  STATUS_LABELS,
  type LeaveBalanceSummary,
  type LeaveRequestDisplay,
} from "@/lib/data/leave-balance";

// ページタイトル
const PAGE_TITLE = "ダッシュボード";

// ステータスに応じたスタイル
const STATUS_STYLES: Record<LeaveRequestDisplay["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

// セクションカード（統一されたカードスタイル）
function SectionCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {action}
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}

// 統計アイテム（残日数や使用日数の表示）
function StatItem({
  label,
  value,
  unit = "日",
  highlight = false,
}: {
  label: string;
  value: number;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      <p className="text-sm text-slate-600">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${
          highlight ? "text-blue-600" : "text-slate-900"
        }`}
      >
        {value}
        <span className="ml-1 text-sm font-normal text-slate-500">{unit}</span>
      </p>
    </div>
  );
}

// 有給残高カード
function LeaveBalanceCard({ balance }: { balance: LeaveBalanceSummary }) {
  const totalDays = balance.grantedDays + balance.carriedOverDays;

  return (
    <SectionCard title="有給残高">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <StatItem label="残日数" value={balance.remainingDays} highlight />
        <StatItem label="付与日数" value={balance.grantedDays} />
        <StatItem label="繰越日数" value={balance.carriedOverDays} />
        <StatItem label="使用日数" value={balance.usedDays} />
      </div>

      {/* 進捗バー */}
      <div className="mt-6">
        <div className="mb-2 flex justify-between text-xs text-slate-600">
          <span>使用済み: {balance.usedDays}日</span>
          <span>合計: {totalDays}日</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{
              width: `${(balance.usedDays / totalDays) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* 有効期限 */}
      <p className="mt-4 text-sm text-slate-600">
        有効期限: {formatDateJa(balance.expiresAt)}
      </p>
    </SectionCard>
  );
}

// 有給残高が未設定の場合の表示
function NoBalanceCard() {
  return (
    <SectionCard title="有給残高">
      <div className="py-8 text-center text-slate-600">
        <p>今年度の有給残高が設定されていません。</p>
        <p className="mt-2 text-sm">管理者にお問い合わせください。</p>
      </div>
    </SectionCard>
  );
}

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
    <tr className="border-b border-slate-100 last:border-b-0">
      <td className="py-3 text-sm text-slate-900">
        {formatDateJa(request.requestDate)}
      </td>
      <td className="py-3 text-sm text-slate-600">
        {LEAVE_TYPE_LABELS[request.leaveType]}
      </td>
      <td className="py-3 text-sm text-slate-600">{request.days}日</td>
      <td className="py-3">
        <StatusBadge status={request.status} />
      </td>
    </tr>
  );
}

// 最近の申請カード
function RecentRequestsCard({
  requests,
  pendingCount,
}: {
  requests: LeaveRequestDisplay[];
  pendingCount: number;
}) {
  const hasRequests = requests.length > 0;

  const actionLink = (
    <Link
      href="/requests/new"
      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
    >
      新規申請
    </Link>
  );

  return (
    <SectionCard title="最近の申請" action={actionLink}>
      {/* 承認待ち通知 */}
      {pendingCount > 0 && (
        <div className="mb-4 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          {pendingCount}件の申請が承認待ちです
        </div>
      )}

      {hasRequests ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="pb-3">日付</th>
                <th className="pb-3">種類</th>
                <th className="pb-3">日数</th>
                <th className="pb-3">ステータス</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <RequestRow key={request.id} request={request} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-slate-600">
          申請履歴がありません
        </p>
      )}

      {hasRequests && (
        <div className="mt-4 text-center">
          <Link
            href="/requests"
            className="text-sm text-slate-600 underline underline-offset-4 hover:text-slate-900"
          >
            すべての申請を見る
          </Link>
        </div>
      )}
    </SectionCard>
  );
}

// ウェルカムメッセージ
function WelcomeHeader({ name }: { name: string }) {
  const today = new Date();
  const greeting = getGreetingByHour(today.getHours());

  return (
    <header className="mb-8">
      <h1 className="text-2xl font-bold text-slate-900">{PAGE_TITLE}</h1>
      <p className="mt-1 text-slate-600">
        {greeting}、{name}さん
      </p>
    </header>
  );
}

// 時間帯に応じた挨拶
function getGreetingByHour(hour: number): string {
  if (hour < 12) return "おはようございます";
  if (hour < 18) return "こんにちは";
  return "こんばんは";
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const employeeId = Number(session.user.id);
  const userName = session.user.name ?? "ユーザー";

  // データを並列で取得
  const [balance, recentRequests, pendingCount] = await Promise.all([
    getLeaveBalanceByEmployeeId(employeeId),
    getRecentRequestsByEmployeeId(employeeId),
    getPendingRequestCount(employeeId),
  ]);

  return (
    <>
      <WelcomeHeader name={userName} />

      <div className="space-y-6">
        {/* 有給残高 */}
        {balance ? (
          <LeaveBalanceCard balance={balance} />
        ) : (
          <NoBalanceCard />
        )}

        {/* 最近の申請 */}
        <RecentRequestsCard requests={recentRequests} pendingCount={pendingCount} />
      </div>
    </>
  );
}
