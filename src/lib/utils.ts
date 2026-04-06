import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 日本の労働基準法に基づく有給休暇付与日数を計算
 * @param hireDate 入社日
 * @param targetDate 計算基準日（デフォルト: 今日）
 * @returns 付与日数
 */
export function calculateGrantedDays(hireDate: Date, targetDate: Date = new Date()): number {
  const monthsWorked = getMonthsDifference(hireDate, targetDate);

  // 6ヶ月未満は付与なし
  if (monthsWorked < 6) return 0;

  // 勤続年数に応じた付与日数（労働基準法準拠）
  const yearsWorked = Math.floor((monthsWorked - 6) / 12);

  const grantTable: Record<number, number> = {
    0: 10, // 6ヶ月
    1: 11, // 1年6ヶ月
    2: 12, // 2年6ヶ月
    3: 14, // 3年6ヶ月
    4: 16, // 4年6ヶ月
    5: 18, // 5年6ヶ月
  };

  // 6年6ヶ月以上は20日
  if (yearsWorked >= 6) return 20;

  return grantTable[yearsWorked] ?? 10;
}

/**
 * 2つの日付間の月数を計算
 */
export function getMonthsDifference(startDate: Date, endDate: Date): number {
  const years = endDate.getFullYear() - startDate.getFullYear();
  const months = endDate.getMonth() - startDate.getMonth();
  const days = endDate.getDate() - startDate.getDate();

  let totalMonths = years * 12 + months;
  if (days < 0) totalMonths -= 1;

  return totalMonths;
}

/**
 * 有給付与日を計算（入社日から6ヶ月後、以降は1年ごと）
 * @param hireDate 入社日
 * @returns 次回付与日
 */
export function getNextGrantDate(hireDate: Date): Date {
  const today = new Date();
  const firstGrantDate = new Date(hireDate);
  firstGrantDate.setMonth(firstGrantDate.getMonth() + 6);

  if (today < firstGrantDate) {
    return firstGrantDate;
  }

  // 6ヶ月以降は1年ごと
  let grantDate = new Date(firstGrantDate);
  while (grantDate <= today) {
    grantDate.setFullYear(grantDate.getFullYear() + 1);
  }

  return grantDate;
}

/**
 * 有給の有効期限を計算（付与日から2年後）
 * @param grantDate 付与日
 * @returns 有効期限
 */
export function getExpirationDate(grantDate: Date): Date {
  const expiration = new Date(grantDate);
  expiration.setFullYear(expiration.getFullYear() + 2);
  return expiration;
}

/**
 * 繰越可能日数を計算（最大20日）
 * @param remainingDays 残日数
 * @returns 繰越可能日数
 */
export function calculateCarryOverDays(remainingDays: number): number {
  return Math.min(remainingDays, 20);
}

/**
 * 日付をYYYY-MM-DD形式にフォーマット
 */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * 日付を日本語形式（YYYY年MM月DD日）にフォーマット
 */
export function formatDateJa(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
