"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import SearchableSelect from "@/components/dashboard/searchableselect";

interface ProductionEntry {
  id: string;
  entry_id: string;
  worker_id: string;
  style_id: string;
  qty_completed: number;
  rate_per_piece: number;
  amount_earned: number;
  entry_date: string;
  role: string;
  department: string;
  worker: { name: string };
  style: { style_name: string };
}

interface Props {
  entry: ProductionEntry | null;
  workers: {
    id: string;
    name: string;
    worker_id: string;
    role: string;
    department: string;
  }[];
  styles: { id: string; style_name: string; style_no: string }[];
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
  const [rate, setRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
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
    if (isEdit) return;

    const worker = workers.find((w) => w.id === form.worker_id);
    const styleId = form.style_id;

    if (!worker || !styleId) return;

    setRateLoading(true);
    setRate(null);

    supabase
      .from("style_role_rates")
      .select("worker_rate")
      .eq("style_id", styleId)
      .eq("role", worker.role)
      .single()
      .then(({ data }) => {
        const fetchedRate = data?.worker_rate ?? 0;
        setRate(fetchedRate);
        setAmountEarned(fetchedRate * (parseInt(form.qty_completed) || 0));
        setRateLoading(false);
      });
  }, [form.worker_id, form.style_id]);

  useEffect(() => {
    if (rate !== null) {
      setAmountEarned(rate * (parseInt(form.qty_completed) || 0));
    }
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
      // Check if this entry falls within a paid wage cycle for this worker
      const { data: paidCycle, error: paymentError } = await supabase
        .from("wage_payments")
        .select("id")
        .eq("worker_id", entry!.worker_id)
        .eq("payment_status", "Paid")
        .lte("cycle_start", entry!.entry_date)
        .gte("cycle_end", entry!.entry_date)
        .limit(1)
        .maybeSingle();

      if (paymentError) {
        setError(paymentError.message);
        return;
      }

      if (paidCycle) {
        setError(
          "This entry cannot be deleted because the worker has already been paid for this cycle.",
        );
        return;
      }

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

    if (!isEdit && (rate === null || rate === 0)) {
      setError(
        "No rate found for this worker's role and style. Please set it in the Styles module first.",
      );
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
      const { error: dbError } = await supabase
        .from("production_entries")
        .update({ qty_completed: qty })
        .eq("id", entry!.id);

      setSaving(false);
      if (dbError) setError(dbError.message);
      else onSaved();
    } else {
      const worker = workers.find((w) => w.id === form.worker_id)!;
      const entryId = await generateEntryId(user.id);

      const payload = {
        user_id: user.id,
        entry_id: entryId,
        worker_id: form.worker_id,
        style_id: form.style_id,
        qty_completed: qty,
        rate_per_piece: rate!,
        role: worker.role,
        department: worker.department,
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

  const selectedWorker = workers.find((w) => w.id === form.worker_id);

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
              <SearchableSelect
                value={form.worker_id}
                onChange={(val) =>
                  setForm((prev) => ({ ...prev, worker_id: val }))
                }
                disabled={isEdit}
                placeholder="Search worker..."
                options={workers.map((w) => ({
                  value: w.id,
                  label: `${w.name} (${w.worker_id})`,
                  subLabel: `${w.role} • ${w.department}`,
                }))}
              />
            </div>
            <div className="form-group">
              <label>
                Style <span className="required">*</span>
              </label>
              <SearchableSelect
                value={form.style_id}
                onChange={(val) =>
                  setForm((prev) => ({ ...prev, style_id: val }))
                }
                disabled={isEdit}
                placeholder="Search style..."
                options={styles.map((s) => ({
                  value: s.id,
                  label: s.style_name,
                  subLabel: `Style No: ${s.style_no}`,
                }))}
              />
            </div>
          </div>

          {!isEdit && selectedWorker && (
            <div className="entry-worker-context">
              <span className="context-pill">{selectedWorker.department}</span>
              <span className="context-pill">{selectedWorker.role}</span>
              <span className="context-rate">
                {rateLoading
                  ? "Looking up rate..."
                  : rate !== null && rate > 0
                    ? `₹${rate} / piece`
                    : "No rate set for this combination"}
              </span>
            </div>
          )}

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
              <input
                value={
                  rateLoading ? "Loading..." : rate !== null ? `₹${rate}` : "—"
                }
                readOnly
                className="input-readonly"
              />
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
                disabled={saving || rateLoading}
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
