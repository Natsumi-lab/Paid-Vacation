import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

// ナビゲーション項目の定義
const NAVIGATION_ITEMS = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/requests/new", label: "有給申請" },
  { href: "/requests", label: "申請履歴" },
] as const;

const ADMIN_NAVIGATION_ITEMS = [
  { href: "/admin/requests", label: "申請管理" },
  { href: "/admin/employees", label: "従業員管理" },
] as const;

type NavigationItem = {
  href: string;
  label: string;
};

function NavigationLink({ item }: { item: NavigationItem }) {
  return (
    <Link
      href={item.href}
      className="block rounded-lg px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
    >
      {item.label}
    </Link>
  );
}

function NavigationSection({
  title,
  items,
}: {
  title: string;
  items: readonly NavigationItem[];
}) {
  return (
    <div className="mb-6">
      <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
      <nav className="space-y-1">
        {items.map((item) => (
          <NavigationLink key={item.href} item={item} />
        ))}
      </nav>
    </div>
  );
}

function UserInfoCard({
  name,
  department,
}: {
  name: string;
  department: string;
}) {
  return (
    <div className="rounded-lg bg-slate-100 px-4 py-3">
      <p className="text-sm font-medium text-slate-900">{name}</p>
      <p className="text-xs text-slate-600">{department}</p>
    </div>
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { name, department, role } = session.user;
  const isAdmin = role === "admin";

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* サイドバー */}
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
        {/* ロゴエリア */}
        <header className="border-b border-slate-200 px-6 py-4">
          <h1 className="text-lg font-bold text-slate-900">有給管理</h1>
        </header>

        {/* ナビゲーション */}
        <div className="flex-1 overflow-y-auto px-2 py-4">
          <NavigationSection title="メニュー" items={NAVIGATION_ITEMS} />

          {isAdmin && (
            <NavigationSection title="管理者" items={ADMIN_NAVIGATION_ITEMS} />
          )}
        </div>

        {/* ユーザー情報・ログアウト */}
        <div className="border-t border-slate-200 p-4">
          <UserInfoCard name={name ?? ""} department={department ?? ""} />
          <form action={handleSignOut} className="mt-3">
            <button
              type="submit"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              ログアウト
            </button>
          </form>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
