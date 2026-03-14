"use client";

import { useState } from "react";

interface WageRow {
  worker: { name: string; email: string };
  receiptHtml: string | null;
  paidOn: string | null;
}

interface Props {
  row: WageRow;
  cycleLabel: string;
  onClose: () => void;
  onResend: () => Promise<void>;
}

export default function ReceiptModal({
  row,
  cycleLabel,
  onClose,
  onResend,
}: Props) {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    setResending(true);
    await onResend();
    setResending(false);
    setResent(true);
    setTimeout(() => setResent(false), 3000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-receipt" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Receipt · {row.worker.name}</h3>
            <p className="modal-header-sub">
              {cycleLabel} · sent to {row.worker.email}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body receipt-body">
          {row.receiptHtml ? (
            <iframe
              srcDoc={row.receiptHtml}
              className="receipt-iframe"
              title="Receipt Preview"
              sandbox="allow-same-origin"
            />
          ) : (
            <p className="wages-expense-empty">No receipt available.</p>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-sm ghost" onClick={onClose}>
            Close
          </button>
          <button
            className="btn-sm primary"
            onClick={handleResend}
            disabled={resending}
          >
            {resending
              ? "Resending..."
              : resent
                ? "✓ Sent!"
                : "Resend to Worker"}
          </button>
        </div>
      </div>
    </div>
  );
}
