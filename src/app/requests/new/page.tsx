"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

const PAGE_TITLE = "有給申請";
const PAGE_DESCRIPTION = "取得したい日付と種類を選択してください";
const DASHBOARD_PATH = "/dashboard";

type LeaveType = "full" | "am_half" | "pm_half";

type LeaveRequestFormValues = {
  requestDate: string;
  leaveType: LeaveType;
  reason: string;
};

type ValidationErrors = {
  requestDate?: string;
  leaveType?: string;
};

const LEAVE_TYPE_OPTIONS: { value: LeaveType; label: string; days: number }[] = [
  { value: "full", label: "全日休", days: 1 },
  { value: "am_half", label: "午前半休", days: 0.5 },
  { value: "pm_half", label: "午後半休", days: 0.5 },
];

function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

function validateForm(values: LeaveRequestFormValues): ValidationErrors {
  const errors: ValidationErrors = {};

  if (values.requestDate.trim() === "") {
    errors.requestDate = "日付を選択してください。";
  } else {
    const selectedDate = new Date(values.requestDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      errors.requestDate = "過去の日付は選択できません。";
    }
  }

  if (!values.leaveType) {
    errors.leaveType = "種類を選択してください。";
  }

  return errors;
}

function hasValidationErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

export default function NewRequestPage() {
  const router = useRouter();

  const [formValues, setFormValues] = useState<LeaveRequestFormValues>({
    requestDate: "",
    leaveType: "full",
    reason: "",
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [submitErrorMessage, setSubmitErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedDays = useMemo(() => {
    const option = LEAVE_TYPE_OPTIONS.find((opt) => opt.value === formValues.leaveType);
    return option?.days ?? 1;
  }, [formValues.leaveType]);

  const isSubmitDisabled = useMemo(() => {
    return isSubmitting;
  }, [isSubmitting]);

  function updateField<K extends keyof LeaveRequestFormValues>(
    fieldName: K,
    value: LeaveRequestFormValues[K]
  ) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value,
    }));

    setValidationErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]: undefined,
    }));

    setSubmitErrorMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = validateForm(formValues);
    setValidationErrors(errors);
    setSubmitErrorMessage("");

    if (hasValidationErrors(errors)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestDate: formValues.requestDate,
          leaveType: formValues.leaveType,
          days: selectedDays,
          reason: formValues.reason || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setSubmitErrorMessage(data.message || "申請の送信に失敗しました。");
        return;
      }

      router.push(DASHBOARD_PATH);
    } catch (error) {
      console.error("Leave request submission failed:", error);
      setSubmitErrorMessage(
        "予期しないエラーが発生しました。時間をおいて再度お試しください。"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">{PAGE_TITLE}</h1>
            <p className="mt-2 text-sm text-slate-600">{PAGE_DESCRIPTION}</p>
          </header>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {/* 日付選択 */}
            <div>
              <label
                htmlFor="requestDate"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                取得希望日 <span className="text-red-500">*</span>
              </label>
              <input
                id="requestDate"
                name="requestDate"
                type="date"
                min={getTodayString()}
                value={formValues.requestDate}
                onChange={(event) => updateField("requestDate", event.target.value)}
                aria-invalid={Boolean(validationErrors.requestDate)}
                aria-describedby={
                  validationErrors.requestDate ? "requestDate-error" : undefined
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
              {validationErrors.requestDate ? (
                <p id="requestDate-error" className="mt-2 text-sm text-red-600">
                  {validationErrors.requestDate}
                </p>
              ) : null}
            </div>

            {/* 休暇種類 */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                休暇種類 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {LEAVE_TYPE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center rounded-lg border px-4 py-3 transition ${
                      formValues.leaveType === option.value
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="leaveType"
                      value={option.value}
                      checked={formValues.leaveType === option.value}
                      onChange={(event) =>
                        updateField("leaveType", event.target.value as LeaveType)
                      }
                      className="sr-only"
                    />
                    <span className="flex-1 text-sm font-medium text-slate-900">
                      {option.label}
                    </span>
                    <span className="text-sm text-slate-500">{option.days}日</span>
                  </label>
                ))}
              </div>
              {validationErrors.leaveType ? (
                <p className="mt-2 text-sm text-red-600">
                  {validationErrors.leaveType}
                </p>
              ) : null}
            </div>

            {/* 申請理由 */}
            <div>
              <label
                htmlFor="reason"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                申請理由（任意）
              </label>
              <textarea
                id="reason"
                name="reason"
                rows={3}
                value={formValues.reason}
                onChange={(event) => updateField("reason", event.target.value)}
                className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                placeholder="例: 私用のため"
              />
            </div>

            {/* 消化日数の確認 */}
            <div className="rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-sm text-slate-600">
                消化日数:{" "}
                <span className="font-semibold text-slate-900">{selectedDays}日</span>
              </p>
            </div>

            {/* エラーメッセージ */}
            {submitErrorMessage ? (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {submitErrorMessage}
              </div>
            ) : null}

            {/* 送信ボタン */}
            <div className="flex gap-3">
              <Link
                href={DASHBOARD_PATH}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "送信中..." : "申請する"}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link
            href={DASHBOARD_PATH}
            className="text-sm text-slate-600 underline underline-offset-4 hover:text-slate-900"
          >
            ダッシュボードに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
