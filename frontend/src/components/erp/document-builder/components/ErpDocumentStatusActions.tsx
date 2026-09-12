"use client";

import { erpButtonClassName } from "@/components/workspace/styles";

/** Shared document workflow actions for commercial registers (post / cancel). */
export function ErpDocumentStatusActions({
  canPost,
  canCancel,
  posting,
  onPost,
  onCancel,
}: {
  canPost?: boolean;
  canCancel?: boolean;
  posting?: boolean;
  onPost?: () => void;
  onCancel?: () => void;
}) {
  if (!canPost && !canCancel) return null;
  return (
    <div className="flex items-center gap-1.5">
      {canPost && onPost ? (
        <button
          type="button"
          disabled={posting}
          className={`${erpButtonClassName.primary} text-xs cursor-pointer`}
          onClick={onPost}
        >
          {posting ? "Posting…" : "Post"}
        </button>
      ) : null}
      {canCancel && onCancel ? (
        <button
          type="button"
          disabled={posting}
          className={`${erpButtonClassName.secondary} text-xs cursor-pointer`}
          onClick={onCancel}
        >
          Cancel doc
        </button>
      ) : null}
    </div>
  );
}
