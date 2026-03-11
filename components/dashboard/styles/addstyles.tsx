"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

interface Style {
  id: string;
  style_no: string;
  style_name: string;
  category: string;
  rate_per_piece: number;
  company: string;
  status: "Active" | "Inactive" | "Low Stock";
}

interface Props {
  style: Style | null;
  categories: string[];
  onClose: () => void;
  onSaved: () => void;
}

const STATUSES = ["Active", "Inactive"];

export default function AddStyleModal({ style, categories, onClose, onSaved }: Props) {
  const isEdit = !!style;

  const [form, setForm] = useState({
    style_no: "",
    style_name: "",
    category: categories[0] ?? "",
    rate_per_piece: "",
    company: "",
    status: "Active",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (style) {
      setForm({
        style_no: style.style_no,
        style_name: style.style_name,
        category: style.category,
        rate_per_piece: String(style.rate_per_piece),
        company: style.company,
        status: style.status,
      });
    }
  }, [style]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async () => {
    if (!form.style_no || !form.style_name || !form.rate_per_piece || !form.company) {
      setError("Please fill in all required fields.");
      return;
    }

    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated. Please log in again.");
      setSaving(false);
      return;
    }

    const payload = {
      user_id: user.id,
      style_no: form.style_no,
      style_name: form.style_name,
      category: form.category,
      rate_per_piece: parseFloat(form.rate_per_piece),
      company: form.company,
      status: form.status,
    };

    const { error: dbError } = isEdit
      ? await supabase.from("styles").update(payload).eq("id", style!.id)
      : await supabase.from("styles").insert(payload);

    setSaving(false);
    if (dbError) {
      setError(dbError.message);
    } else {
      onSaved();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? "Edit Style" : "Add New Style"}</h3>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {error && <p className="modal-error">{error}</p>}

          <div className="form-row">
            <div className="form-group">
              <label>Style No <span className="required">*</span></label>
              <input name="style_no" value={form.style_no} onChange={handleChange} placeholder="e.g. 001" />
            </div>
            <div className="form-group">
              <label>Style Name <span className="required">*</span></label>
              <input name="style_name" value={form.style_name} onChange={handleChange} placeholder="e.g. T-Shirt (Basic)" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select name="category" value={form.category} onChange={handleChange}>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Rate / Piece (₹) <span className="required">*</span></label>
              <input name="rate_per_piece" type="number" value={form.rate_per_piece} onChange={handleChange} placeholder="e.g. 22" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Company <span className="required">*</span></label>
              <input name="company" value={form.company} onChange={handleChange} placeholder="e.g. Sameer Enterprises" />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-sm ghost" onClick={onClose}>Cancel</button>
          <button className="btn-sm primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Style"}
          </button>
        </div>
      </div>
    </div>
  );
}