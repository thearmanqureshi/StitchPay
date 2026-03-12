"use client";

import { useState, useEffect } from "react";
import Header from "@/components/dashboard/Header";
import { supabase } from "@/lib/supabase/client";
import LogEntryModal from "@/components/dashboard/production/logentry";
import "@/app/styles.css";
import "@/app/production.css";

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

export default function ProductionPage() {
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [workers, setWorkers] = useState<{ id: string; name: string; worker_id: string }[]>([]);
  const [styles, setStyles] = useState<{ id: string; style_name: string; rate_per_piece: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [workerFilter, setWorkerFilter] = useState("all");
  const [styleFilter, setStyleFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState<ProductionEntry | null>(null);

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("production_entries")
      .select(`
        *,
        worker:workers(name),
        style:styles(style_name)
      `)
      .order("entry_date", { ascending: false })
      .order("entry_id", { ascending: false });

    if (!error && data) setEntries(data);
    setLoading(false);
  };

  const fetchWorkersAndStyles = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: w }, { data: s }] = await Promise.all([
      supabase.from("workers").select("id, name, worker_id").eq("user_id", user.id).order("worker_id"),
      supabase.from("styles").select("id, style_name, rate_per_piece").eq("user_id", user.id).order("style_no"),
    ]);

    if (w) setWorkers(w);
    if (s) setStyles(s);
  };

  useEffect(() => {
    fetchEntries();
    fetchWorkersAndStyles();
  }, []);

  const handleExport = () => {
    const rows = [
      ["Entry ID", "Worker", "Style", "Qty Completed", "Rate / Pc", "Amount Earned", "Entry Date"],
      ...filteredEntries.map((e) => [
        e.entry_id,
        e.worker?.name ?? "",
        e.style?.style_name ?? "",
        e.qty_completed,
        e.rate_per_piece,
        e.amount_earned,
        formatDate(e.entry_date),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "production_entries.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredEntries = entries.filter((e) => {
    const matchSearch =
      e.entry_id.toLowerCase().includes(search.toLowerCase()) ||
      (e.worker?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.style?.style_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchWorker = workerFilter === "all" || e.worker_id === workerFilter;
    const matchStyle = styleFilter === "all" || e.style_id === styleFilter;
    return matchSearch && matchWorker && matchStyle;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const currentMonthLabel = new Date().toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <>
      <Header
        title="Production Entries"
        section="Payroll"
        subSection="Production"
        exportAction={{ label: "Export", onClick: handleExport }}
        action={{ label: "Log Entry", onClick: () => { setEditEntry(null); setShowModal(true); } }}
      />

      <div className="page-content">
        {/* Toolbar */}
        <div className="styles-toolbar">
          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search entries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-select-wrapper">
            <svg className="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            <select className="filter-select" value={workerFilter} onChange={(e) => setWorkerFilter(e.target.value)}>
              <option value="all">All Workers</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <svg className="filter-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          <div className="filter-select-wrapper">
            <svg className="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.2l1.6 9.6A2 2 0 0 0 5.86 20h12.28a2 2 0 0 0 1.98-1.74l1.6-9.6a2 2 0 0 0-1.34-2.2Z" />
            </svg>
            <select className="filter-select" value={styleFilter} onChange={(e) => setStyleFilter(e.target.value)}>
              <option value="all">All Styles</option>
              {styles.map((s) => (
                <option key={s.id} value={s.id}>{s.style_name}</option>
              ))}
            </select>
            <svg className="filter-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Table Card */}
        <div className="table-card">
          <div className="table-card-header">
            <div>
              <h2 className="table-card-title">Production Entries</h2>
              <p className="table-card-sub">
                {currentMonthLabel} · {filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"} logged
              </p>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="styles-table">
              <thead>
                <tr>
                  <th>Entry ID</th>
                  <th>Worker</th>
                  <th>Style</th>
                  <th>Qty Completed</th>
                  <th>Rate / Pc</th>
                  <th>Amount Earned</th>
                  <th>Entry Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="table-empty">
                      <div className="table-loading">
                        <div className="spinner" />
                        Loading entries...
                      </div>
                    </td>
                  </tr>
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="table-empty">No entries found</td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="style-no">{entry.entry_id}</td>
                      <td>
                        <div className="worker-cell">
                          <div className="worker-avatar pe-avatar">
                            {(entry.worker?.name ?? "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <span className="style-name">{entry.worker?.name ?? "—"}</span>
                        </div>
                      </td>
                      <td>{entry.style?.style_name ?? "—"}</td>
                      <td className="pe-qty">{entry.qty_completed}</td>
                      <td className="pe-rate">₹{entry.rate_per_piece}</td>
                      <td className="pe-amount">₹{entry.amount_earned.toLocaleString("en-IN")}</td>
                      <td className="pe-date">{formatDate(entry.entry_date)}</td>
                      <td>
                        <button
                          className="action-btn"
                          onClick={() => { setEditEntry(entry); setShowModal(true); }}
                          title="Edit entry"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <LogEntryModal
          entry={editEntry}
          workers={workers}
          styles={styles}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchEntries(); }}
        />
      )}
    </>
  );
}