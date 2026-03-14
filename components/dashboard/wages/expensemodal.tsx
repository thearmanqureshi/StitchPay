"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface WageRow {
  id: string | null;
  worker: { id: string; name: string; worker_id: string };
  grossWage: number;
  expenses: number;
  netWage: number;
}

interface Props {
  row: WageRow;
  onClose: () => void;
  onSaved: () => void;
}

export default function ExpenseModal({ row, onClose, onSaved }: Props) {
  const [expense, setExpense] = useState(
    row.expenses > 0 ? String(row.expenses) : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const expenseVal = parseFloat(expense) || 0;
  const netPreview = row.grossWage - expenseVal;

  const handleSubmit = async () => {
    if (expense === "") {
      setError("Please enter an expense amount. Enter 0 if none.");
      return;
    }

    if (expenseVal < 0) {
      setError("Expense cannot be negative.");
      return;
    }

    if (!row.id) {
      setError("Wage record not found. Please generate the sheet first.");
      return;
    }

    setSaving(true);

    const { error: dbError } = await supabase
      .from("wage_payments")
      .update({ expenses: expenseVal })
      .eq("id", row.id);

    setSaving(false);
    if (dbError) setError(dbError.message);
    else onSaved();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Set Expense · {row.worker.name}</h3>
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

        <div className="modal-body">
          {error && <p className="modal-error">{error}</p>}

          <div className="form-group">
            <label>Expense / Deduction (₹)</label>
            <input
              type="number"
              value={expense}
              onChange={(e) => {
                setExpense(e.target.value);
                setError("");
              }}
              placeholder="Enter 0 if no deductions"
              min="0"
            />
            <p className="wages-expense-hint">
              Enter 0 if this worker has no deductions this cycle.
            </p>
          </div>

          <div className="entry-preview">
            <div className="entry-preview-row">
              <span>Gross Wage</span>
              <span>₹{row.grossWage.toLocaleString("en-IN")}</span>
            </div>
            <div className="entry-preview-row">
              <span>Expense</span>
              <span>− ₹{expenseVal.toLocaleString("en-IN")}</span>
            </div>
            <div className="entry-preview-row">
              <span>Net Wage</span>
              <span className="entry-preview-amount">
                ₹{netPreview.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-sm ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-sm primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Expense"}
          </button>
        </div>
      </div>
    </div>
  );
}
