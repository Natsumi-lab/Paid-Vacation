"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";

const PAGE_TITLE = "パスワードリセット";
const PAGE_DESCRIPTION = "新しいパスワードを入力してください";
const LOGIN_PATH = "/login";

type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

type ValidationErrors = {
  password?: string;
  confirmPassword?: string;
};

const PASSWORD_MIN_LENGTH = 8;

function validatePassword(password: string): string | undefined {
  if (password.trim() === "") {
    return "パスワードを入力してください。";
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `パスワードは${PASSWORD_MIN_LENGTH}文字以上で入力してください。`;
  }
  return undefined;
}

function validateForm(values: ResetPasswordFormValues): ValidationErrors {
  const errors: ValidationErrors = {};

  const passwordError = validatePassword(values.password);
  if (passwordError) {
    errors.password = passwordError;
  }

  if (values.confirmPassword.trim() === "") {
    errors.confirmPassword = "確認用パスワードを入力してください。";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "パスワードが一致しません。";
  }

  return errors;
}

function hasValidationErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [formValues, setFormValues] = useState<ResetPasswordFormValues>({
    password: "",
    confirmPassword: "",
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );
  const [submitErrorMessage, setSubmitErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isSubmitDisabled = useMemo(() => {
    return isSubmitting;
  }, [isSubmitting]);

  function updateField<K extends keyof ResetPasswordFormValues>(
    fieldName: K,
    value: ResetPasswordFormValues[K],
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
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: formValues.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitErrorMessage(
          data.message || "パスワードのリセットに失敗しました。",
        );
        return;
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error("Reset password request failed:", error);
      setSubmitErrorMessage(
        "予期しないエラーが発生しました。時間をおいて再度お試しください。",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // トークンがない場合
  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">
              無効なリンク
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              パスワードリセットのリンクが無効です。再度パスワードリセットをお試しください。
            </p>
          </header>

          <Link
            href="/forgot-password"
            className="block w-full rounded-lg bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            パスワードリセットを再度申請
          </Link>

          <div className="mt-4 text-center">
            <Link
              href={LOGIN_PATH}
              className="text-sm text-slate-600 underline underline-offset-4 hover:text-slate-900"
            >
              ログインページに戻る
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 成功画面
  if (isSubmitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">
              パスワードを変更しました
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              パスワードが正常に変更されました。新しいパスワードでログインしてください。
            </p>
          </header>

          <Link
            href={LOGIN_PATH}
            className="block w-full rounded-lg bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            ログインページへ
          </Link>
        </div>
      </main>
    );
  }

  // フォーム画面
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{PAGE_TITLE}</h1>
          <p className="mt-2 text-sm text-slate-600">{PAGE_DESCRIPTION}</p>
        </header>

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              新しいパスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={formValues.password}
              onChange={(event) => updateField("password", event.target.value)}
              aria-invalid={Boolean(validationErrors.password)}
              aria-describedby={
                validationErrors.password ? "password-error" : undefined
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="8文字以上で入力"
            />
            {validationErrors.password ? (
              <p id="password-error" className="mt-2 text-sm text-red-600">
                {validationErrors.password}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              新しいパスワード（確認）
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={formValues.confirmPassword}
              onChange={(event) =>
                updateField("confirmPassword", event.target.value)
              }
              aria-invalid={Boolean(validationErrors.confirmPassword)}
              aria-describedby={
                validationErrors.confirmPassword
                  ? "confirmPassword-error"
                  : undefined
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="パスワードを再入力"
            />
            {validationErrors.confirmPassword ? (
              <p
                id="confirmPassword-error"
                className="mt-2 text-sm text-red-600"
              >
                {validationErrors.confirmPassword}
              </p>
            ) : null}
          </div>

          {submitErrorMessage ? (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {submitErrorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "変更中..." : "パスワードを変更"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href={LOGIN_PATH}
            className="text-sm text-slate-600 underline underline-offset-4 hover:text-slate-900"
          >
            ログインページに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-center text-slate-600">読み込み中...</p>
          </div>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
