"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useMemo, useState } from "react";

const PAGE_TITLE = "有給休暇管理システム";
const PAGE_DESCRIPTION = "社員番号とパスワードを入力してください";
const FORGOT_PASSWORD_PATH = "/forgot-password";
const DEFAULT_REDIRECT_PATH = "/dashboard";

type LoginFormValues = {
  employeeNumber: string;
  password: string;
};

type ValidationErrors = {
  employeeNumber?: string;
  password?: string;
};

function validateLoginForm(values: LoginFormValues): ValidationErrors {
  const errors: ValidationErrors = {};

  if (values.employeeNumber.trim() === "") {
    errors.employeeNumber = "社員番号を入力してください。";
  }

  if (values.password.trim() === "") {
    errors.password = "パスワードを入力してください。";
  }

  return errors;
}

function hasValidationErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

export default function LoginPage() {
  const router = useRouter();

  const [formValues, setFormValues] = useState<LoginFormValues>({
    employeeNumber: "",
    password: "",
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );
  const [loginErrorMessage, setLoginErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSubmitDisabled = useMemo(() => {
    return isSubmitting;
  }, [isSubmitting]);

  function updateField<K extends keyof LoginFormValues>(
    fieldName: K,
    value: LoginFormValues[K],
  ) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value,
    }));

    setValidationErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]: undefined,
    }));

    setLoginErrorMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = validateLoginForm(formValues);
    setValidationErrors(errors);
    setLoginErrorMessage("");

    if (hasValidationErrors(errors)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        employeeNumber: formValues.employeeNumber,
        password: formValues.password,
        redirect: false,
      });

      if (!result) {
        setLoginErrorMessage("ログイン処理に失敗しました。");
        return;
      }

      if (result.error) {
        setLoginErrorMessage("社員番号またはパスワードが正しくありません。");
        return;
      }

      router.push(DEFAULT_REDIRECT_PATH);
      router.refresh();
    } catch (error) {
      console.error("Login failed:", error);
      setLoginErrorMessage(
        "予期しないエラーが発生しました。時間をおいて再度お試しください。",
      );
    } finally {
      setIsSubmitting(false);
    }
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
              htmlFor="employeeNumber"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              社員番号
            </label>
            <input
              id="employeeNumber"
              name="employeeNumber"
              type="text"
              autoComplete="username"
              value={formValues.employeeNumber}
              onChange={(event) =>
                updateField("employeeNumber", event.target.value)
              }
              aria-invalid={Boolean(validationErrors.employeeNumber)}
              aria-describedby={
                validationErrors.employeeNumber
                  ? "employeeNumber-error"
                  : undefined
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="例: 1001"
            />
            {validationErrors.employeeNumber ? (
              <p
                id="employeeNumber-error"
                className="mt-2 text-sm text-red-600"
              >
                {validationErrors.employeeNumber}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={formValues.password}
              onChange={(event) => updateField("password", event.target.value)}
              aria-invalid={Boolean(validationErrors.password)}
              aria-describedby={
                validationErrors.password ? "password-error" : undefined
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="パスワードを入力"
            />
            {validationErrors.password ? (
              <p id="password-error" className="mt-2 text-sm text-red-600">
                {validationErrors.password}
              </p>
            ) : null}
          </div>

          {loginErrorMessage ? (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {loginErrorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href={FORGOT_PASSWORD_PATH}
            className="text-sm text-slate-600 underline underline-offset-4 hover:text-slate-900"
          >
            パスワードを忘れた方はこちら
          </Link>
        </div>
      </div>
    </main>
  );
}
