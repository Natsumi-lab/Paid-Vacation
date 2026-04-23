"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

const PAGE_TITLE = "パスワードを忘れた方";
const PAGE_DESCRIPTION = "登録されているメールアドレスを入力してください";
const LOGIN_PATH = "/login";

type ForgotPasswordFormValues = {
  email: string;
};

type ValidationErrors = {
  email?: string;
};

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateForm(values: ForgotPasswordFormValues): ValidationErrors {
  const errors: ValidationErrors = {};

  if (values.email.trim() === "") {
    errors.email = "メールアドレスを入力してください。";
  } else if (!validateEmail(values.email)) {
    errors.email = "有効なメールアドレスを入力してください。";
  }

  return errors;
}

function hasValidationErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

export default function ForgotPasswordPage() {
  const [formValues, setFormValues] = useState<ForgotPasswordFormValues>({
    email: "",
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

  function updateField<K extends keyof ForgotPasswordFormValues>(
    fieldName: K,
    value: ForgotPasswordFormValues[K],
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
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: formValues.email }),
      });

      if (!response.ok) {
        const data = await response.json();
        setSubmitErrorMessage(
          data.message || "リクエストの送信に失敗しました。",
        );
        return;
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error("Forgot password request failed:", error);
      setSubmitErrorMessage(
        "予期しないエラーが発生しました。時間をおいて再度お試しください。",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">
              メールを送信しました
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              パスワードリセット用のリンクを送信しました。メールをご確認ください。
            </p>
          </header>

          <p className="mb-6 text-sm text-slate-500">
            メールが届かない場合は、迷惑メールフォルダをご確認いただくか、再度お試しください。
          </p>

          <Link
            href={LOGIN_PATH}
            className="block w-full rounded-lg bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            ログインページに戻る
          </Link>
        </div>
      </main>
    );
  }

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
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formValues.email}
              onChange={(event) => updateField("email", event.target.value)}
              aria-invalid={Boolean(validationErrors.email)}
              aria-describedby={
                validationErrors.email ? "email-error" : undefined
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="例: yamada@example.com"
            />
            {validationErrors.email ? (
              <p id="email-error" className="mt-2 text-sm text-red-600">
                {validationErrors.email}
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
            {isSubmitting ? "送信中..." : "リセットリンクを送信"}
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
