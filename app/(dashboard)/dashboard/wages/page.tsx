"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/dashboard/Header";
import { supabase } from "@/lib/supabase/client";
import ExpenseModal from "@/components/dashboard/wages/expensemodal";
import ReceiptModal from "@/components/dashboard/wages/receiptmodal";
import "@/app/dashboard.css";

interface Worker {
  id: string;
  worker_id: string;
  name: string;
  email: string;
}

interface WageRow {
  id: string | null;
  worker: Worker;
  totalPieces: number;
  grossWage: number;
  expenses: number;
  netWage: number;
  paymentStatus: "Pending" | "Paid";
  paidOn: string | null;
  receiptHtml: string | null;
  expenseSet: boolean;
}

interface Cycle {
  label: string;
  start: Date;
  end: Date;
}

function generateCycles(count: number): Cycle[] {
  const cycles: Cycle[] = [];
  const now = new Date();
  const day = now.getDate();
  let year = now.getFullYear();
  let month = now.getMonth();

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
    } else {
      cycleStart = new Date(
        cycleStart.getFullYear(),
        cycleStart.getMonth() - 1,
        25,
      );
    }
    cycleEnd = prevEnd;
  }

  return cycles;
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default function WagesPage() {
  const cycles = generateCycles(6);
  const [selectedCycleIndex, setSelectedCycleIndex] = useState(0);
  const [wageRows, setWageRows] = useState<WageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [expenseWorker, setExpenseWorker] = useState<WageRow | null>(null);
  const [receiptRow, setReceiptRow] = useState<WageRow | null>(null);

  const selectedCycle = cycles[selectedCycleIndex];

  const generateSheet = useCallback(async () => {
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
      .select("id, worker_id, name, email")
      .eq("user_id", user.id)
      .in("status", ["Active", "On Leave"])
      .order("worker_id");

    if (!workers) {
      setLoading(false);
      return;
    }

    const { data: entries } = await supabase
      .from("production_entries")
      .select("worker_id, qty_completed, amount_earned")
      .eq("user_id", user.id)
      .gte("entry_date", selectedCycle.start.toISOString())
      .lte("entry_date", selectedCycle.end.toISOString());

    const grossMap: Record<string, number> = {};
    const piecesMap: Record<string, number> = {};
    (entries ?? []).forEach((e: any) => {
      grossMap[e.worker_id] = (grossMap[e.worker_id] ?? 0) + e.amount_earned;
      piecesMap[e.worker_id] = (piecesMap[e.worker_id] ?? 0) + e.qty_completed;
    });

    const cycleStartStr = toDateStr(selectedCycle.start);
    const { data: payments } = await supabase
      .from("wage_payments")
      .select("*")
      .eq("user_id", user.id)
      .eq("cycle_start", cycleStartStr);

    const paymentMap: Record<string, any> = {};
    (payments ?? []).forEach((p) => {
      paymentMap[p.worker_id] = p;
    });

    const upsertRows = workers
      .filter((w) => paymentMap[w.id]?.payment_status !== "Paid")
      .map((w) => ({
        user_id: user.id,
        worker_id: w.id,
        cycle_start: cycleStartStr,
        cycle_end: toDateStr(selectedCycle.end),
        gross_wage: grossMap[w.id] ?? 0,
        expenses: paymentMap[w.id]?.expenses ?? 0,
        payment_status: paymentMap[w.id]?.payment_status ?? "Pending",
        paid_on: paymentMap[w.id]?.paid_on ?? null,
        receipt_html: paymentMap[w.id]?.receipt_html ?? null,
      }));

    if (upsertRows.length > 0) {
      await supabase
        .from("wage_payments")
        .upsert(upsertRows, { onConflict: "worker_id,cycle_start" });
    }

    const { data: fresh } = await supabase
      .from("wage_payments")
      .select("*")
      .eq("user_id", user.id)
      .eq("cycle_start", cycleStartStr);

    const freshMap: Record<string, any> = {};
    (fresh ?? []).forEach((p) => {
      freshMap[p.worker_id] = p;
    });

    const rows: WageRow[] = workers.map((w) => {
      const p = freshMap[w.id];
      return {
        id: p?.id ?? null,
        worker: w,
        totalPieces: piecesMap[w.id] ?? 0,
        grossWage: p?.gross_wage ?? 0,
        expenses: p?.expenses ?? 0,
        netWage: p?.net_wage ?? 0,
        paymentStatus: p?.payment_status ?? "Pending",
        paidOn: p?.paid_on ?? null,
        receiptHtml: p?.receipt_html ?? null,
        expenseSet: p != null,
      };
    });

    setWageRows(rows);
    setLoading(false);
  }, [selectedCycleIndex]);

  useEffect(() => {
    generateSheet();
  }, [selectedCycleIndex]);

  const handleMarkPaid = async (row: WageRow) => {
    if (!row.id) return;
    setMarkingPaid(row.worker.id);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMarkingPaid(null);
      return;
    }

    const paidOn = new Date().toISOString();

    const receiptHtml = buildReceiptHtml({
      workerName: row.worker.name,
      workerId: row.worker.worker_id,
      workerEmail: row.worker.email,
      cycleLabel: selectedCycle.label,
      totalPieces: row.totalPieces,
      grossWage: row.grossWage,
      expenses: row.expenses,
      netWage: row.netWage,
      paidOn,
    });

    await supabase
      .from("wage_payments")
      .update({
        payment_status: "Paid",
        paid_on: paidOn,
        receipt_html: receiptHtml,
      })
      .eq("id", row.id);

    await fetch("/api/send-receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: row.worker.email,
        workerName: row.worker.name,
        receiptHtml,
        cycleLabel: selectedCycle.label,
      }),
    });

    setMarkingPaid(null);
    generateSheet();
  };

  const handleExport = () => {
    const rows = [
      [
        "Worker ID",
        "Name",
        "Email",
        "Pieces",
        "Gross Wage",
        "Expenses",
        "Net Wage",
        "Status",
        "Paid On",
      ],
      ...wageRows.map((r) => [
        r.worker.worker_id,
        r.worker.name,
        r.worker.email,
        r.totalPieces,
        r.grossWage,
        r.expenses,
        r.netWage,
        r.paymentStatus,
        r.paidOn ? new Date(r.paidOn).toLocaleDateString("en-IN") : "—",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wages_${selectedCycle.label.replace(/\s/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalDisbursed = wageRows.reduce(
    (sum, r) => sum + (r.paymentStatus === "Paid" ? r.netWage : 0),
    0,
  );
  const paidCount = wageRows.filter((r) => r.paymentStatus === "Paid").length;
  const pendingCount = wageRows.filter(
    (r) => r.paymentStatus === "Pending",
  ).length;

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    return (
      parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`
        : (parts[0]?.slice(0, 2) ?? "??")
    ).toUpperCase();
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

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
        title="Monthly Wages"
        section="Payroll"
        subSection="Wages"
        exportAction={{ label: "Export", onClick: handleExport }}
        action={{
          label: loading ? "Generating..." : "Generate Sheet",
          onClick: generateSheet,
        }}
      />

      <div className="page-content">
        <div className="payroll-summary">
          <div className="payroll-summary-left">
            <p className="summary-period">
              DISBURSEMENT SUMMARY — {selectedCycle.label.toUpperCase()}
            </p>
            <h1 className="summary-total">
              ₹{totalDisbursed.toLocaleString("en-IN")}
            </h1>
            <p className="summary-sub">
              Email notification sent on payment · {paidCount} of{" "}
              {wageRows.length} workers paid
            </p>
          </div>
          <div className="payroll-summary-right">
            <div className="summary-stat">
              <span className="summary-stat-value summary-stat-accent">
                {paidCount}
              </span>
              <span className="summary-stat-label">Paid</span>
            </div>
            <div className="summary-stat">
              <span className="summary-stat-value summary-stat-muted">
                {pendingCount}
              </span>
              <span className="summary-stat-label">Pending</span>
            </div>
          </div>
        </div>

        <div className="styles-toolbar">{cycleSelect}</div>

        <div className="table-card">
          <div className="table-card-header">
            <div>
              <h2 className="table-card-title">Monthly Wage Sheet</h2>
              <p className="table-card-sub">
                Mark as paid to trigger email notification to worker
              </p>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="styles-table">
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Pieces</th>
                  <th>Gross Wage</th>
                  <th>Expenses</th>
                  <th>Net Wage</th>
                  <th>Payment Status</th>
                  <th>Paid On</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="table-empty">
                      <div className="table-loading">
                        <div className="spinner" />
                        Generating wage sheet...
                      </div>
                    </td>
                  </tr>
                ) : wageRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="table-empty">
                      No workers found
                    </td>
                  </tr>
                ) : (
                  wageRows.map((row) => (
                    <tr key={row.worker.id}>
                      <td>
                        <div className="worker-cell">
                          <div className="worker-avatar">
                            {getInitials(row.worker.name)}
                          </div>
                          <div className="worker-info">
                            <p className="worker-name">{row.worker.name}</p>
                            <p className="worker-email">{row.worker.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="pe-qty">
                        {row.totalPieces > 0 ? (
                          row.totalPieces.toLocaleString("en-IN")
                        ) : (
                          <span className="wages-expense-empty">0</span>
                        )}
                      </td>
                      <td className="pe-amount">
                        ₹{row.grossWage.toLocaleString("en-IN")}
                      </td>
                      <td className="wages-expenses">
                        {row.expenseSet ? (
                          <span className="wages-expense-val">
                            ₹{row.expenses.toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="wages-expense-empty">—</span>
                        )}
                      </td>
                      <td className="pe-amount wages-net">
                        {row.expenseSet ? (
                          `₹${row.netWage.toLocaleString("en-IN")}`
                        ) : (
                          <span className="wages-expense-empty">—</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${row.paymentStatus === "Paid" ? "badge-active" : "badge-wages-pending"}`}
                        >
                          <span className="badge-dot" />
                          {row.paymentStatus}
                        </span>
                      </td>
                      <td className="pe-date">
                        {row.paidOn ? (
                          formatDate(row.paidOn)
                        ) : (
                          <span className="wages-expense-empty">—</span>
                        )}
                      </td>
                      <td>
                        <div className="wages-actions">
                          {row.paymentStatus === "Paid" ? (
                            <button
                              className="action-btn"
                              onClick={() => setReceiptRow(row)}
                              title="View receipt"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                          ) : (
                            <>
                              <button
                                className="btn-sm ghost wages-btn-expense"
                                onClick={() => setExpenseWorker(row)}
                              >
                                {row.expenseSet
                                  ? "Edit Expense"
                                  : "+ Add Expense"}
                              </button>
                              {row.expenseSet && (
                                <button
                                  className="btn-sm primary wages-btn-pay"
                                  onClick={() => handleMarkPaid(row)}
                                  disabled={markingPaid === row.worker.id}
                                >
                                  {markingPaid === row.worker.id
                                    ? "Sending..."
                                    : "✓ Mark Paid"}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {expenseWorker && (
        <ExpenseModal
          row={expenseWorker}
          onClose={() => setExpenseWorker(null)}
          onSaved={() => {
            setExpenseWorker(null);
            generateSheet();
          }}
        />
      )}

      {receiptRow && (
        <ReceiptModal
          row={receiptRow}
          cycleLabel={selectedCycle.label}
          onClose={() => setReceiptRow(null)}
          onResend={async () => {
            if (!receiptRow.receiptHtml) return;
            await fetch("/api/send-receipt", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: receiptRow.worker.email,
                workerName: receiptRow.worker.name,
                receiptHtml: receiptRow.receiptHtml,
                cycleLabel: selectedCycle.label,
              }),
            });
          }}
        />
      )}
    </>
  );
}

function buildReceiptHtml({
  workerName,
  workerId,
  workerEmail,
  cycleLabel,
  totalPieces,
  grossWage,
  expenses,
  netWage,
  paidOn,
}: {
  workerName: string;
  workerId: string;
  workerEmail: string;
  cycleLabel: string;
  totalPieces: number;
  grossWage: number;
  expenses: number;
  netWage: number;
  paidOn: string;
}) {
  const date = new Date(paidOn).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 24px; }
  .card { background: #fff; max-width: 480px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
  .header { background: #0b0d11; padding: 28px 32px; }
  .header h1 { color: #c8f060; font-size: 22px; margin: 0 0 4px; }
  .header p { color: #6b7280; font-size: 13px; margin: 0; }
  .body { padding: 28px 32px; }
  .greeting { font-size: 15px; color: #111; margin-bottom: 20px; line-height: 1.6; }
  .row-table { width: 100%; border-collapse: collapse; border-bottom: 1px solid #f0f0f0; }
  .row-table td { padding: 10px 0; font-size: 14px; }
  .row-table td.label { color: #6b7280; width: 60%; }
  .row-table td.value { font-weight: 600; color: #111; text-align: right; width: 40%; }
  .net-wrap { background: #f9fdf0; border-radius: 8px; padding: 4px 16px; margin-top: 16px; }
  .net-table { width: 100%; border-collapse: collapse; }
  .net-table td { padding: 10px 0; }
  .net-table td.label { font-weight: 600; color: #111; font-size: 15px; width: 60%; }
  .net-table td.value { font-size: 18px; color: #4a7c10; font-weight: 700; text-align: right; width: 40%; }
  .footer { background: #f9f9f9; padding: 16px 32px; font-size: 12px; color: #9ca3af; text-align: center; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h1>StitchPay</h1>
    <p>Wage Receipt · ${cycleLabel}</p>
  </div>
  <div class="body">
    <p class="greeting">Hi ${workerName},<br/>Your payment for the cycle <strong>${cycleLabel}</strong> has been processed.</p>
    <table class="row-table" cellpadding="0" cellspacing="0"><tr><td class="label">Worker ID</td><td class="value">${workerId}</td></tr></table>
    <table class="row-table" cellpadding="0" cellspacing="0"><tr><td class="label">Payment Date</td><td class="value">${date}</td></tr></table>
    <table class="row-table" cellpadding="0" cellspacing="0"><tr><td class="label">Total Pieces Completed</td><td class="value">${totalPieces.toLocaleString("en-IN")}</td></tr></table>
    <table class="row-table" cellpadding="0" cellspacing="0"><tr><td class="label">Gross Wage</td><td class="value">₹${grossWage.toLocaleString("en-IN")}</td></tr></table>
    <table class="row-table" cellpadding="0" cellspacing="0" style="border-bottom:none"><tr><td class="label">Expenses (Kharcha)</td><td class="value">- ₹${expenses.toLocaleString("en-IN")}</td></tr></table>
    <div class="net-wrap">
      <table class="net-table" cellpadding="0" cellspacing="0"><tr><td class="label">Net Wage Paid</td><td class="value">₹${netWage.toLocaleString("en-IN")}</td></tr></table>
    </div>
  </div>
  <div class="footer">This is an automated receipt from StitchPay. Please do not reply to this email.</div>
</div>
</body>
</html>`;
}
