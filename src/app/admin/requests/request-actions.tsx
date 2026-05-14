"use client";

import { useState, useTransition } from "react";
import { approveRequest, rejectRequest } from "./actions";

type RequestActionsProps = {
  requestId: number;
};

export function RequestActions({ requestId }: RequestActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveRequest(requestId);
      setMessage({
        type: result.success ? "success" : "error",
        text: result.message,
      });
      if (result.success) {
        setTimeout(() => setMessage(null), 3000);
      }
    });
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setMessage({ type: "error", text: "却下理由を入力してください。" });
      return;
    }

    startTransition(async () => {
      const result = await rejectRequest(requestId, rejectionReason);
      setMessage({
        type: result.success ? "success" : "error",
        text: result.message,
      });
      if (result.success) {
        setShowRejectModal(false);
        setRejectionReason("");
        setTimeout(() => setMessage(null), 3000);
      }
    });
  };

  return (
    <div className="relative">
      {message && (
        <div
          className={`absolute -top-8 left-0 right-0 rounded px-2 py-1 text-xs ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleApprove}
          disabled={isPending}
          className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
        >
          {isPending ? "処理中..." : "承認"}
        </button>
        <button
          type="button"
          onClick={() => setShowRejectModal(true)}
          disabled={isPending}
          className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          却下
        </button>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              申請を却下
            </h3>
            <div className="mb-4">
              <label
                htmlFor="rejectionReason"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                却下理由 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="却下理由を入力してください"
                rows={3}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                  setMessage(null);
                }}
                disabled={isPending}
                className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isPending}
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "処理中..." : "却下する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
