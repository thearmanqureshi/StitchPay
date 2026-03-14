"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

interface Style {
  id: string;
  style_no: string;
  style_name: string;
  category: string;
  company: string;
  status: "Active" | "Inactive";
}

interface Props {
  style: Style | null;
  categories: string[];
  onClose: () => void;
  onSaved: () => void;
}

const STATUSES = ["Active", "Inactive"];

const PRODUCTION_ROLES = ["Singer", "Overlock", "Flat"];
const FINISHING_ROLES = ["Thread Cutting", "Ironing"];

export default function AddStyleModal({
  style,
  categories,
  onClose,
  onSaved,
}: Props) {
  const isEdit = !!style;

  const [form, setForm] = useState({
    style_no: "",
    style_name: "",
    category: categories[0] ?? "",
    company: "",
    status: "Active",
  });

  // Vendor rates per department
  const [vendorRates, setVendorRates] = useState({
    Production: "",
    Finishing: "",
  });

  // Worker rates per role
  const [roleRates, setRoleRates] = useState<Record<string, string>>({
    Signer: "",
    Overlock: "",
    Flat: "",
    "Thread Cutting": "",
    Ironing: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"Production" | "Finishing">(
    "Production",
  );

  useEffect(() => {
    if (style) {
      setForm({
        style_no: style.style_no,
        style_name: style.style_name,
        category: style.category,
        company: style.company,
        status: style.status,
      });

      // Fetch existing vendor rates
      supabase
        .from("style_department_rates")
        .select("department, vendor_rate")
        .eq("style_id", style.id)
        .then(({ data }) => {
          if (data) {
            const updated = { ...vendorRates };
            data.forEach((r) => {
              updated[r.department as "Production" | "Finishing"] = String(
                r.vendor_rate,
              );
            });
            setVendorRates(updated);
          }
        });

      // Fetch existing role rates
      supabase
        .from("style_role_rates")
        .select("role, worker_rate")
        .eq("style_id", style.id)
        .then(({ data }) => {
          if (data) {
            const updated = { ...roleRates };
            data.forEach((r) => {
              updated[r.role] = String(r.worker_rate);
            });
            setRoleRates(updated);
          }
        });
    }
  }, [style]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleVendorRate = (
    dept: "Production" | "Finishing",
    value: string,
  ) => {
    setVendorRates((prev) => ({ ...prev, [dept]: value }));
    setError("");
  };

  const handleRoleRate = (role: string, value: string) => {
    setRoleRates((prev) => ({ ...prev, [role]: value }));
    setError("");
  };

  const handleSubmit = async () => {
    if (!form.style_no || !form.style_name || !form.company) {
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

    // 1. Save/update the style
    const stylePayload = {
      user_id: user.id,
      style_no: form.style_no,
      style_name: form.style_name,
      category: form.category,
      company: form.company,
      status: form.status,
    };

    let styleId = style?.id;

    if (isEdit) {
      const { error: dbError } = await supabase
        .from("styles")
        .update(stylePayload)
        .eq("id", style!.id);
      if (dbError) {
        setError(dbError.message);
        setSaving(false);
        return;
      }
    } else {
      const { data, error: dbError } = await supabase
        .from("styles")
        .insert(stylePayload)
        .select("id")
        .single();
      if (dbError) {
        setError(dbError.message);
        setSaving(false);
        return;
      }
      styleId = data.id;
    }

    // 2. Upsert vendor rates for both departments
    const deptRateRows = (["Production", "Finishing"] as const)
      .filter((d) => vendorRates[d] !== "")
      .map((d) => ({
        user_id: user.id,
        style_id: styleId,
        department: d,
        vendor_rate: parseFloat(vendorRates[d]) || 0,
      }));

    if (deptRateRows.length > 0) {
      const { error: deptError } = await supabase
        .from("style_department_rates")
        .upsert(deptRateRows, { onConflict: "style_id,department" });
      if (deptError) {
        setError(deptError.message);
        setSaving(false);
        return;
      }
    }

    // 3. Upsert worker rates for all roles
    const allRoles = [...PRODUCTION_ROLES, ...FINISHING_ROLES];
    const roleRateRows = allRoles
      .filter((r) => roleRates[r] !== "")
      .map((r) => ({
        user_id: user.id,
        style_id: styleId,
        role: r,
        worker_rate: parseFloat(roleRates[r]) || 0,
      }));

    if (roleRateRows.length > 0) {
      const { error: roleError } = await supabase
        .from("style_role_rates")
        .upsert(roleRateRows, { onConflict: "style_id,role" });
      if (roleError) {
        setError(roleError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    onSaved();
  };

  const activeRoles =
    activeTab === "Production" ? PRODUCTION_ROLES : FINISHING_ROLES;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? "Edit Style" : "Add New Style"}</h3>
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

          {/* Basic Info */}
          <div className="form-row">
            <div className="form-group">
              <label>
                Style No <span className="required">*</span>
              </label>
              <input
                name="style_no"
                value={form.style_no}
                onChange={handleChange}
                placeholder="e.g. 001"
              />
            </div>
            <div className="form-group">
              <label>
                Style Name <span className="required">*</span>
              </label>
              <input
                name="style_name"
                value={form.style_name}
                onChange={handleChange}
                placeholder="e.g. T-Shirt (Basic)"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>
                Company <span className="required">*</span>
              </label>
              <input
                name="company"
                value={form.company}
                onChange={handleChange}
                placeholder="e.g. Sameer Enterprises"
              />
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

          {/* Rate Tabs */}
          <div className="rate-section">
            <div className="rate-section-header">
              <p className="rate-section-title">Rates by Department</p>
              <div className="rate-tabs">
                <button
                  className={`rate-tab ${activeTab === "Production" ? "active" : ""}`}
                  onClick={() => setActiveTab("Production")}
                >
                  Production
                </button>
                <button
                  className={`rate-tab ${activeTab === "Finishing" ? "active" : ""}`}
                  onClick={() => setActiveTab("Finishing")}
                >
                  Finishing
                </button>
              </div>
            </div>

            {/* Vendor rate for active tab */}
            <div className="form-group vendor-rate-group">
              <label>
                Vendor Rate / Piece (₹)
                <span className="rate-hint"> — what the company pays you</span>
              </label>
              <input
                type="number"
                value={vendorRates[activeTab]}
                onChange={(e) => handleVendorRate(activeTab, e.target.value)}
                placeholder="e.g. 10"
              />
            </div>

            {/* Worker rates for roles in active tab */}
            <div className="role-rates-grid">
              {activeRoles.map((role) => (
                <div className="form-group" key={role}>
                  <label>{role} Rate (₹)</label>
                  <input
                    type="number"
                    value={roleRates[role]}
                    onChange={(e) => handleRoleRate(role, e.target.value)}
                    placeholder="e.g. 4"
                  />
                </div>
              ))}
            </div>

            {/* Margin preview */}
            {vendorRates[activeTab] &&
              activeRoles.some((r) => roleRates[r]) &&
              (() => {
                const vendor = parseFloat(vendorRates[activeTab]) || 0;
                const paid = activeRoles.reduce(
                  (sum, r) => sum + (parseFloat(roleRates[r]) || 0),
                  0,
                );
                const saved = vendor - paid;
                return (
                  <div className="rate-preview">
                    <div className="rate-preview-row">
                      <span>Vendor Rate</span>
                      <span>₹{vendor}</span>
                    </div>
                    <div className="rate-preview-row">
                      <span>Total Paid to Workers</span>
                      <span>₹{paid}</span>
                    </div>
                    <div className="rate-preview-row rate-preview-margin">
                      <span>Your Margin</span>
                      <span
                        className={
                          saved >= 0 ? "margin-positive" : "margin-negative"
                        }
                      >
                        ₹{saved.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })()}
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
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Style"}
          </button>
        </div>
      </div>
    </div>
  );
}
