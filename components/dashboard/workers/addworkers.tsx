"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

interface Worker {
  id: string;
  worker_id: string;
  name: string;
  email: string;
  phone: string;
  department: "Production" | "Finishing";
  role: string;
  status: "Active" | "Inactive" | "On Leave";
}

interface Props {
  worker: Worker | null;
  onClose: () => void;
  onSaved: () => void;
}

const STATUSES = ["Active", "Inactive", "On Leave"];

const DEPARTMENT_ROLES: Record<string, string[]> = {
  Production: ["Singer", "Overlock", "Flat"],
  Finishing: ["Thread Cutting", "Ironing"],
};

export default function AddWorkerModal({ worker, onClose, onSaved }: Props) {
  const isEdit = !!worker;

  const [form, setForm] = useState({
    worker_id: "",
    name: "",
    email: "",
    phone: "",
    department: "Production",
    role: "Singer",
    status: "Active",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (worker) {
      setForm({
        worker_id: worker.worker_id,
        name: worker.name,
        email: worker.email,
        phone: worker.phone,
        department: worker.department,
        role: worker.role,
        status: worker.status,
      });
    }
  }, [worker]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "department") {
      const firstRole = DEPARTMENT_ROLES[value][0];
      setForm((prev) => ({ ...prev, department: value, role: firstRole }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    setError("");
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    const { error: dbError } = await supabase
      .from("workers")
      .delete()
      .eq("id", worker!.id);

    setDeleting(false);
    if (dbError) setError(dbError.message);
    else onSaved();
  };

  const handleSubmit = async () => {
    if (
      !form.worker_id ||
      !form.name ||
      !form.email ||
      !form.phone ||
      !form.role
    ) {
      setError("Please fill in all required fields.");
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

    const payload = {
      user_id: user.id,
      worker_id: form.worker_id,
      name: form.name,
      email: form.email,
      phone: form.phone,
      department: form.department,
      role: form.role,
      status: form.status,
    };

    const { error: dbError } = isEdit
      ? await supabase.from("workers").update(payload).eq("id", worker!.id)
      : await supabase.from("workers").insert(payload);

    setSaving(false);
    if (dbError) setError(dbError.message);
    else onSaved();
  };

  const availableRoles = DEPARTMENT_ROLES[form.department];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? "Edit Worker" : "Add New Worker"}</h3>
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
                Worker ID <span className="required">*</span>
              </label>
              <input
                name="worker_id"
                value={form.worker_id}
                onChange={handleChange}
                placeholder="e.g. SNG-001"
              />
            </div>
            <div className="form-group">
              <label>
                Full Name <span className="required">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Raju Rastogi"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Email <span className="required">*</span>
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="e.g. raju@workshop.com"
              />
            </div>
            <div className="form-group">
              <label>
                Phone <span className="required">*</span>
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="e.g. 98100 00001"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Department <span className="required">*</span>
              </label>
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
              >
                <option value="Production">Production</option>
                <option value="Finishing">Finishing</option>
              </select>
            </div>
            <div className="form-group">
              <label>
                Role <span className="required">*</span>
              </label>
              <select name="role" value={form.role} onChange={handleChange}>
                {availableRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          {/* Delete — only in edit mode */}
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
                  : "Delete Worker"}
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
                disabled={saving}
              >
                {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Worker"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
