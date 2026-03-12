"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

interface ProductionEntry {
  id: string;
  entry_id: string;
  worker_id: string;
  style_id: string;
  qty_completed: number;
  rate_per_piece: number;
  amount_earned: number;
  entry_date: string;
  worker: { name: string };
  style: { style_name: string };
}

interface Props {
  entry: ProductionEntry | null;
  workers: { id: string; name: string; worker_id: string }[];
  styles: { id: string; style_name: string; rate_per_piece: number }[];
  onClose: () => void;
  onSaved: () => void;
}

export default function LogEntryModal({
  entry,
  workers,
  styles,
  onClose,
  onSaved,
}: Props) {
  const isEdit = !!entry;

  const [form, setForm] = useState({
    worker_id: workers[0]?.id ?? "",
    style_id: styles[0]?.id ?? "",
    qty_completed: "",
  });
  const [rate, setRate] = useState(0);
  const [amountEarned, setAmountEarned] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (entry) {
      setForm({
        worker_id: entry.worker_id,
        style_id: entry.style_id,
        qty_completed: String(entry.qty_completed),
      });
      setRate(entry.rate_per_piece);
      setAmountEarned(entry.amount_earned);
    }
  }, [entry]);

  useEffect(() => {
    if (!isEdit) {
      const selectedStyle = styles.find((s) => s.id === form.style_id);
      const newRate = selectedStyle?.rate_per_piece ?? 0;
      setRate(newRate);
      setAmountEarned(newRate * (parseInt(form.qty_completed) || 0));
    }
  }, [form.style_id]);

  useEffect(() => {
    setAmountEarned(rate * (parseInt(form.qty_completed) || 0));
  }, [form.qty_completed, rate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const generateEntryId = async (userId: string): Promise<string> => {
    const { count } = await supabase
      .from("production_entries")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const next = (count ?? 0) + 1;
    return `PE-${String(next).padStart(4, "0")}`;
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    const { error: dbError } = await supabase
      .from("production_entries")
      .delete()
      .eq("id", entry!.id);

    setDeleting(false);
    if (dbError) setError(dbError.message);
    else onSaved();
  };

  const handleSubmit = async () => {
    if (!form.worker_id || !form.style_id || !form.qty_completed) {
      setError("Please fill in all required fields.");
      return;
    }

    const qty = parseInt(form.qty_completed);
    if (isNaN(qty) || qty <= 0) {
      setError("Quantity must be a positive number.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated. Please log in again.");
      setSaving(false);
      return;
    }

    if (isEdit) {
      const payload = {
        qty_completed: qty,
      };

      const { error: dbError } = await supabase
        .from("production_entries")
        .update(payload)
        .eq("id", entry!.id);

      setSaving(false);
      if (dbError) setError(dbError.message);
      else onSaved();
    } else {
      const selectedStyle = styles.find((s) => s.id === form.style_id);
      const snapshotRate = selectedStyle?.rate_per_piece ?? 0;
      const entryId = await generateEntryId(user.id);

      const payload = {
        user_id: user.id,
        entry_id: entryId,
        worker_id: form.worker_id,
        style_id: form.style_id,
        qty_completed: qty,
        rate_per_piece: snapshotRate,
        entry_date: new Date().toISOString(),
      };

      const { error: dbError } = await supabase
        .from("production_entries")
        .insert(payload);

      setSaving(false);
      if (dbError) setError(dbError.message);
      else onSaved();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {isEdit
              ? `Edit Entry · ${entry!.entry_id}`
              : "Log Production Entry"}
          </h3>
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

          <div className="form-row">
            <div className="form-group">
              <label>
                Worker <span className="required">*</span>
              </label>
              <select
                name="worker_id"
                value={form.worker_id}
                onChange={handleChange}
                disabled={isEdit}
              >
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.worker_id})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>
                Style <span className="required">*</span>
              </label>
              <select
                name="style_id"
                value={form.style_id}
                onChange={handleChange}
                disabled={isEdit}
              >
                {styles.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.style_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Qty Completed <span className="required">*</span>
              </label>
              <input
                name="qty_completed"
                type="number"
                value={form.qty_completed}
                onChange={handleChange}
                placeholder="e.g. 48"
                min="1"
              />
            </div>
            <div className="form-group">
              <label>Rate / Piece</label>
              <input value={`₹${rate}`} readOnly className="input-readonly" />
            </div>
          </div>

          <div className="entry-preview">
            <div className="entry-preview-row">
              <span>Amount Earned</span>
              <span className="entry-preview-amount">
                ₹{amountEarned.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="entry-preview-row">
              <span>Entry Date</span>
              <span>
                {new Date().toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            {isEdit && (
              <p className="entry-edit-note">
                ⚠ Worker, style and rate are locked after entry. Only quantity
                can be edited.
              </p>
            )}
          </div>
        </div>

        <div className="modal-footer">
          {/* Delete button — only in edit mode */}
          {isEdit && (
            <button
              className={`btn-sm ${confirmDelete ? "btn-danger-confirm" : "btn-danger"}`}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting
                ? "Deleting..."
                : confirmDelete
                  ? "Confirm Delete"
                  : "Delete Entry"}
            </button>
          )}

          {/* Cancel confirm delete if user changes mind */}
          {confirmDelete && (
            <button
              className="btn-sm ghost"
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </button>
          )}

          {!confirmDelete && (
            <>
              <button className="btn-sm ghost" onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn-sm primary"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? "Saving..." : isEdit ? "Save Changes" : "Log Entry"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
