"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/dashboard/Header";
import { supabase } from "@/lib/supabase/client";
import "@/app/styles.css";
import "@/app/payroll.css";

interface Worker {
  id: string;
  worker_id: string;
  name: string;
}

interface StyleBreakdown {
  style_name: string;
  qty: number;
  rate: number;
  amount: number;
}

interface WorkerPayroll {
  worker: Worker;
  styles: StyleBreakdown[];
  totalPieces: number;
  grossWage: number;
  status: "Ready" | "No Data";
}

interface Cycle {
  label: string;
  start: Date;
  end: Date;
}

function generateCycles(count: number): Cycle[] {
  const cycles: Cycle[] = [];
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  const day = now.getDate();

  let cycleStart: Date;
  let cycleEnd: Date;

  if (day >= 10 && day < 25) {
    cycleStart = new Date(year, month, 10);
    cycleEnd = new Date(year, month, 24, 23, 59, 59);
  } else if (day >= 25) {
    cycleStart = new Date(year, month, 25);
    cycleEnd = new Date(year, month + 1, 9, 23, 59, 59);
  } else {
    cycleStart = new Date(year, month - 1, 25);
    cycleEnd = new Date(year, month, 9, 23, 59, 59);
  }

  for (let i = 0; i < count; i++) {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const startLabel = `${cycleStart.getDate()} ${monthNames[cycleStart.getMonth()]}`;
    const endLabel = `${cycleEnd.getDate()} ${monthNames[cycleEnd.getMonth()]} ${cycleEnd.getFullYear()}`;
    cycles.push({
      label: `${startLabel} – ${endLabel}`,
      start: new Date(cycleStart),
      end: new Date(cycleEnd),
    });

    const prevEnd = new Date(cycleStart.getTime() - 1000);
    if (cycleStart.getDate() === 25) {
      cycleStart = new Date(
        cycleStart.getFullYear(),
        cycleStart.getMonth(),
        10,
      );
      cycleEnd = prevEnd;
    } else {
      cycleStart = new Date(
        cycleStart.getFullYear(),
        cycleStart.getMonth() - 1,
        25,
      );
      cycleEnd = prevEnd;
    }
  }

  return cycles;
}

export default function PayrollPage() {
  const cycles = generateCycles(6);
  const [selectedCycleIndex, setSelectedCycleIndex] = useState(0);
  const [payrollData, setPayrollData] = useState<WorkerPayroll[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [lastCalculated, setLastCalculated] = useState<Date | null>(null);

  const selectedCycle = cycles[selectedCycleIndex];

  const calculate = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: workers } = await supabase
      .from("workers")
      .select("id, worker_id, name")
      .eq("user_id", user.id)
      .order("worker_id");

    if (!workers) {
      setLoading(false);
      return;
    }

    const { data: entries } = await supabase
      .from("production_entries")
      .select(
        "worker_id, style_id, qty_completed, rate_per_piece, amount_earned, styles(style_name)",
      )
      .eq("user_id", user.id)
      .gte("entry_date", selectedCycle.start.toISOString())
      .lte("entry_date", selectedCycle.end.toISOString());

    const workerMap: Record<string, StyleBreakdown[]> = {};
    (entries ?? []).forEach((e: any) => {
      if (!workerMap[e.worker_id]) workerMap[e.worker_id] = [];
      const styleName = e.styles?.style_name ?? "Unknown";
      const existing = workerMap[e.worker_id].find(
        (s) => s.style_name === styleName && s.rate === e.rate_per_piece,
      );
      if (existing) {
        existing.qty += e.qty_completed;
        existing.amount += e.amount_earned;
      } else {
        workerMap[e.worker_id].push({
          style_name: styleName,
          qty: e.qty_completed,
          rate: e.rate_per_piece,
          amount: e.amount_earned,
        });
      }
    });

    const result: WorkerPayroll[] = workers.map((worker) => {
      const styles = workerMap[worker.id] ?? [];
      const totalPieces = styles.reduce((sum, s) => sum + s.qty, 0);
      const grossWage = styles.reduce((sum, s) => sum + s.amount, 0);
      return {
        worker,
        styles,
        totalPieces,
        grossWage,
        status: styles.length > 0 ? "Ready" : "No Data",
      };
    });

    setPayrollData(result);
    setLastCalculated(new Date());
    setLoading(false);
  }, [selectedCycleIndex]);

  useEffect(() => {
    calculate();
  }, [selectedCycleIndex]);

  const handleExport = () => {
    const rows = [
      [
        "Worker ID",
        "Worker Name",
        "Style",
        "Qty",
        "Rate",
        "Amount",
        "Total Pieces",
        "Gross Wage",
        "Status",
      ],
    ];
    payrollData.forEach((wp) => {
      if (wp.styles.length === 0) {
        rows.push([
          wp.worker.worker_id,
          wp.worker.name,
          "—",
          "0",
          "0",
          "0",
          "0",
          "0",
          "No Data",
        ]);
      } else {
        wp.styles.forEach((s, i) => {
          rows.push([
            i === 0 ? wp.worker.worker_id : "",
            i === 0 ? wp.worker.name : "",
            s.style_name,
            String(s.qty),
            String(s.rate),
            String(s.amount),
            i === 0 ? String(wp.totalPieces) : "",
            i === 0 ? String(wp.grossWage) : "",
            i === 0 ? wp.status : "",
          ]);
        });
      }
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll_${selectedCycle.label.replace(/\s/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredData = payrollData.filter(
    (wp) =>
      wp.worker.name.toLowerCase().includes(search.toLowerCase()) ||
      wp.worker.worker_id.toLowerCase().includes(search.toLowerCase()),
  );

  const totalWages = payrollData.reduce((sum, wp) => sum + wp.grossWage, 0);
  const totalPieces = payrollData.reduce((sum, wp) => sum + wp.totalPieces, 0);
  const totalStyles = new Set(
    payrollData.flatMap((wp) => wp.styles.map((s) => s.style_name)),
  ).size;
  const readyCount = payrollData.filter((wp) => wp.status === "Ready").length;
  const noDataCount = payrollData.filter(
    (wp) => wp.status === "No Data",
  ).length;

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    return (
      parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`
        : (parts[0]?.slice(0, 2) ?? "??")
    ).toUpperCase();
  };

  const cycleSelect = (
    <div className="filter-select-wrapper">
      <svg
        className="filter-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
      <select
        className="filter-select cycle-select"
        value={selectedCycleIndex}
        onChange={(e) => setSelectedCycleIndex(Number(e.target.value))}
      >
        {cycles.map((c, i) => (
          <option key={i} value={i}>
            {i === 0 ? `Current · ${c.label}` : c.label}
          </option>
        ))}
      </select>
      <svg
        className="filter-chevron"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );

  return (
    <>
      <Header
        title="Payroll Calculation"
        section="Payroll"
        subSection="Calculate"
        exportAction={{ label: "Export", onClick: handleExport }}
        action={{
          label: loading ? "Calculating..." : "Recalculate",
          onClick: calculate,
        }}
      />

      <div className="page-content">
        {/* Summary Card */}
        <div className="payroll-summary">
          <div className="payroll-summary-left">
            <p className="summary-period">
              TOTAL WAGES — {selectedCycle.label.toUpperCase()}
            </p>
            <h1 className="summary-total">
              ₹{totalWages.toLocaleString("en-IN")}
            </h1>
            <p className="summary-sub">
              Calculated from {totalPieces.toLocaleString("en-IN")} pieces
              across {totalStyles} {totalStyles === 1 ? "style" : "styles"}
            </p>
          </div>
          <div className="payroll-summary-right">
            <div className="summary-stat">
              <span className="summary-stat-value">{payrollData.length}</span>
              <span className="summary-stat-label">Workers</span>
            </div>
            <div className="summary-stat">
              <span className="summary-stat-value summary-stat-accent">
                {readyCount}
              </span>
              <span className="summary-stat-label">Ready</span>
            </div>
            <div className="summary-stat">
              <span className="summary-stat-value summary-stat-muted">
                {noDataCount}
              </span>
              <span className="summary-stat-label">No Data</span>
            </div>
          </div>
        </div>

        <div className="styles-toolbar">
          <div className="search-box">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search workers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {cycleSelect}
          {lastCalculated && (
            <p className="last-calculated">
              Last calculated ·{" "}
              {lastCalculated.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>

        {/* Table */}
        <div className="table-card">
          <div className="table-card-header">
            <div>
              <h2 className="table-card-title">Wage Breakdown by Worker</h2>
              <p className="table-card-sub">Style × Quantity = Wage</p>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="styles-table">
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Styles Worked</th>
                  <th>Total Pieces</th>
                  <th>Gross Wage</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="table-empty">
                      <div className="table-loading">
                        <div className="spinner" />
                        Calculating payroll...
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="table-empty">
                      No workers found
                    </td>
                  </tr>
                ) : (
                  filteredData.map((wp) => (
                    <tr key={wp.worker.id}>
                      <td>
                        <div className="worker-cell">
                          <div className="worker-avatar">
                            {getInitials(wp.worker.name)}
                          </div>
                          <div className="worker-info">
                            <p className="worker-name">{wp.worker.name}</p>
                            <p className="worker-email">
                              {wp.worker.worker_id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        {wp.styles.length === 0 ? (
                          <span className="payroll-no-entries">—</span>
                        ) : (
                          <div className="payroll-styles-list">
                            {wp.styles.map((s, i) => (
                              <div key={i} className="payroll-style-row">
                                <span className="payroll-style-name">
                                  {s.style_name}
                                </span>
                                <span className="payroll-style-detail">
                                  {s.qty} pcs × ₹{s.rate}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="pe-qty">
                        {wp.totalPieces > 0 ? (
                          <div className="payroll-pieces-list">
                            {wp.styles.map((s, i) => (
                              <div key={i} className="payroll-piece-row">
                                {s.qty}
                              </div>
                            ))}
                          </div>
                        ) : (
                          "0"
                        )}
                      </td>
                      <td className="pe-amount">
                        ₹{wp.grossWage.toLocaleString("en-IN")}
                      </td>
                      <td>
                        <span
                          className={`badge ${wp.status === "Ready" ? "badge-active" : "badge-inactive"}`}
                        >
                          <span className="badge-dot" />
                          {wp.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
