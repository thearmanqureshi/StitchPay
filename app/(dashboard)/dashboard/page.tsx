"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/dashboard/Header";
import { supabase } from "@/lib/supabase/client";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import "@/app/dashboard.css";

interface TopPerformer {
  id: string;
  name: string;
  pieces: number;
}

interface RecentEntry {
  id: string;
  workerName: string;
  styleName: string;
  qty: number;
  rate: number;
  amount: number;
  entryDate: string;
}

interface DayData {
  day: string;
  pieces: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    workers: 0,
    newWorkers: 0,
    styles: 0,
    newStyles: 0,
    pieces: 0,
    piecesDelta: 0,
    wages: 0,
    unpaid: 0,
  });
  const [chartData, setChartData] = useState<DayData[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickOpen, setQuickOpen] = useState(false);
  const quickRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (quickRef.current && !quickRef.current.contains(e.target as Node)) {
        setQuickOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const now = new Date();
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).toISOString();
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    ).toISOString();
    const lastMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    ).toISOString();
    const lastMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
    ).toISOString();
    const twelveMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 11,
      1,
    ).toISOString();

    const [
      { count: totalWorkers },
      { count: newWorkers },
      { count: totalStyles },
      { count: newStyles },
      { data: entriesThisMonth },
      { data: entriesLastMonth },
      { data: recentEntriesData },
      { data: wageData },
      { data: allEntries },
    ] = await Promise.all([
      supabase
        .from("workers")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("workers")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", monthStart),
      supabase
        .from("styles")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "Active"),
      supabase
        .from("styles")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", monthStart),
      supabase
        .from("production_entries")
        .select("worker_id, qty_completed, amount_earned, entry_date")
        .eq("user_id", user.id)
        .gte("entry_date", monthStart)
        .lte("entry_date", monthEnd),
      supabase
        .from("production_entries")
        .select("qty_completed")
        .eq("user_id", user.id)
        .gte("entry_date", lastMonthStart)
        .lte("entry_date", lastMonthEnd),
      supabase
        .from("production_entries")
        .select("*, worker:workers(name), style:styles(style_name)")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false })
        .limit(5),
      supabase
        .from("wage_payments")
        .select("net_wage, payment_status")
        .eq("user_id", user.id)
        .gte(
          "cycle_start",
          new Date(now.getFullYear(), now.getMonth(), 1)
            .toISOString()
            .split("T")[0],
        ),
      supabase
        .from("production_entries")
        .select("qty_completed, entry_date")
        .eq("user_id", user.id)
        .gte("entry_date", twelveMonthsAgo),
    ]);

    // Stats
    const totalPieces = (entriesThisMonth ?? []).reduce(
      (s: number, e: any) => s + e.qty_completed,
      0,
    );
    const lastPieces = (entriesLastMonth ?? []).reduce(
      (s: number, e: any) => s + e.qty_completed,
      0,
    );
    const pieceDelta =
      lastPieces > 0
        ? Math.round(((totalPieces - lastPieces) / lastPieces) * 100)
        : totalPieces > 0
          ? 100
          : 0;
    const totalWages = (wageData ?? [])
      .filter((w: any) => w.payment_status === "Pending")
      .reduce((s: number, w: any) => s + (w.net_wage ?? 0), 0);
    const unpaidCount = (wageData ?? []).filter(
      (w: any) => w.payment_status === "Pending",
    ).length;

    // Top performers
    const perfMap: Record<string, { name: string; pieces: number }> = {};
    (entriesThisMonth ?? []).forEach((e: any) => {
      if (!perfMap[e.worker_id]) perfMap[e.worker_id] = { name: "", pieces: 0 };
      perfMap[e.worker_id].pieces += e.qty_completed;
    });
    const workerIds = Object.keys(perfMap);
    if (workerIds.length > 0) {
      const { data: workerNames } = await supabase
        .from("workers")
        .select("id, name")
        .in("id", workerIds);
      (workerNames ?? []).forEach((w: any) => {
        if (perfMap[w.id]) perfMap[w.id].name = w.name;
      });
    }
    const topPerfs = Object.entries(perfMap)
      .map(([id, v]) => ({ id, name: v.name, pieces: v.pieces }))
      .sort((a, b) => b.pieces - a.pieces)
      .slice(0, 4);

    // Chart — pieces per month for last 12 months
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
    const monthMap: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthMap[key] = 0;
    }
    (allEntries ?? []).forEach((e: any) => {
      const d = new Date(e.entry_date);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (monthMap[key] !== undefined) monthMap[key] += e.qty_completed;
    });
    const chartArr = Object.entries(monthMap).map(([day, pieces]) => ({
      day,
      pieces,
    }));

    // Recent entries
    const recent = (recentEntriesData ?? []).map((e: any) => ({
      id: e.id,
      workerName: e.worker?.name ?? "—",
      styleName: e.style?.style_name ?? "—",
      qty: e.qty_completed,
      rate: e.rate_per_piece,
      amount: e.amount_earned,
      entryDate: e.entry_date,
    }));

    setStats({
      workers: totalWorkers ?? 0,
      newWorkers: newWorkers ?? 0,
      styles: totalStyles ?? 0,
      newStyles: newStyles ?? 0,
      pieces: totalPieces,
      piecesDelta: pieceDelta,
      wages: totalWages,
      unpaid: unpaidCount,
    });
    setChartData(chartArr);
    setTopPerformers(topPerfs);
    setRecentEntries(recent);
    setLoading(false);
  };

  const formatAmount = (n: number) => {
    if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${n.toLocaleString("en-IN")}`;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    return (
      parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`
        : (parts[0]?.slice(0, 2) ?? "??")
    ).toUpperCase();
  };

  const statCards = [
    {
      label: "Total Workers",
      value: String(stats.workers),
      sub:
        stats.newWorkers > 0
          ? `↑ ${stats.newWorkers} added this month`
          : `↓ ${stats.newWorkers} added this month`,
      subUp: stats.newWorkers > 0,
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: "Active Styles",
      value: String(stats.styles),
      sub:
        stats.newStyles > 0
          ? `↑ ${stats.newStyles} new styles`
          : `↓ ${stats.newStyles} new styles`,
      subUp: stats.newStyles > 0,
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.2l1.6 9.6A2 2 0 0 0 5.86 20h12.28a2 2 0 0 0 1.98-1.74l1.6-9.6a2 2 0 0 0-1.34-2.2Z" />
        </svg>
      ),
    },
    {
      label: "Pieces This Month",
      value: stats.pieces.toLocaleString("en-IN"),
      sub: `${stats.piecesDelta >= 0 ? "↑" : "↓"} ${Math.abs(stats.piecesDelta)}% vs last month`,
      subUp: stats.piecesDelta >= 0,
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      label: "Total Wages Due",
      value: formatAmount(stats.wages),
      sub:
        stats.unpaid === 0
          ? "✓ All workers paid"
          : `↓ ${stats.unpaid} unpaid workers`,
      subUp: stats.unpaid === 0,
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 3h12" />
          <path d="M6 7h12" />
          <path d="M6 11h6a4 4 0 0 0 0-8" />
          <line x1="6" y1="11" x2="18" y2="21" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <Header
        title="Dashboard"
        section="Overview"
        action={{ label: "Quick Add", onClick: () => setQuickOpen((p) => !p) }}
      />

      <div className="page-content">
        {/* Quick Add Dropdown */}
        <div className="quick-add-wrapper" ref={quickRef}>
          {quickOpen && (
            <div className="quick-add-dropdown">
              <button
                className="quick-add-item"
                onClick={() => {
                  setQuickOpen(false);
                  router.push("/dashboard/styles");
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.2l1.6 9.6A2 2 0 0 0 5.86 20h12.28a2 2 0 0 0 1.98-1.74l1.6-9.6a2 2 0 0 0-1.34-2.2Z" />
                </svg>
                Add Style
              </button>
              <button
                className="quick-add-item"
                onClick={() => {
                  setQuickOpen(false);
                  router.push("/dashboard/workers");
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                Add Worker
              </button>
              <button
                className="quick-add-item"
                onClick={() => {
                  setQuickOpen(false);
                  router.push("/dashboard/production");
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Log Entry
              </button>
            </div>
          )}
        </div>

        {/* Stat Cards */}
        <div className="dash-stats-grid">
          {statCards.map((card, i) => (
            <div key={i} className="dash-stat-card">
              <div className="dash-stat-top">
                <p className="dash-stat-label">{card.label}</p>
                <div className="dash-stat-icon">{card.icon}</div>
              </div>
              <p className="dash-stat-value">{card.value}</p>
              <p
                className={`dash-stat-sub ${card.subUp ? "dash-stat-sub-up" : "dash-stat-sub-down"}`}
              >
                {card.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Chart + Top Performers */}
        <div className="dash-mid-grid">
          <div className="table-card dash-chart-card">
            <div className="table-card-header">
              <div>
                <h2 className="table-card-title">Production Overview</h2>
                <p className="table-card-sub">Pieces completed per month</p>
              </div>
            </div>
            <div className="dash-chart-wrap">
              {loading ? (
                <div className="table-loading">
                  <div className="spinner" />
                  Loading chart...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart
                    data={chartData}
                    margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="accentGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#c8f060"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#c8f060"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: "#6b7280", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      tickFormatter={(v) => v.split(" ")[0]}
                    />
                    <YAxis
                      tick={{ fill: "#6b7280", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#1a1e27",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                        color: "#f0f2f5",
                        fontSize: 13,
                      }}
                      labelStyle={{ color: "#9ca3af" }}
                      itemStyle={{ color: "#c8f060" }}
                      formatter={(v: any) => [`${v} pcs`, "Pieces"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="pieces"
                      stroke="#c8f060"
                      strokeWidth={2}
                      fill="url(#accentGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: "#c8f060" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="table-card dash-perf-card">
            <div className="table-card-header">
              <div>
                <h2 className="table-card-title">Top Performers</h2>
                <p className="table-card-sub">Highest output this month</p>
              </div>
            </div>
            <div className="dash-perf-list">
              {loading ? (
                <div className="table-loading">
                  <div className="spinner" />
                  Loading...
                </div>
              ) : topPerformers.length === 0 ? (
                <p className="table-empty" style={{ padding: "20px 0" }}>
                  No entries this month
                </p>
              ) : (
                topPerformers.map((p) => (
                  <div key={p.id} className="dash-perf-row">
                    <div className="worker-cell">
                      <div className="worker-avatar">{getInitials(p.name)}</div>
                      <p className="worker-name">{p.name}</p>
                    </div>
                    <span className="dash-perf-badge">
                      {p.pieces.toLocaleString("en-IN")} pcs
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Entries */}
        <div className="table-card">
          <div className="table-card-header">
            <div>
              <h2 className="table-card-title">Recent Production Entries</h2>
              <p className="table-card-sub">Latest logged outputs</p>
            </div>
            <button
              className="btn-sm ghost"
              onClick={() => router.push("/dashboard/production")}
            >
              View all
            </button>
          </div>
          <div className="table-wrapper">
            <table className="styles-table">
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Style</th>
                  <th>Qty</th>
                  <th>Rate/Pc</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="table-empty">
                      <div className="table-loading">
                        <div className="spinner" />
                        Loading entries...
                      </div>
                    </td>
                  </tr>
                ) : recentEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-empty">
                      No entries yet
                    </td>
                  </tr>
                ) : (
                  recentEntries.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <div className="worker-cell">
                          <div className="worker-avatar">
                            {getInitials(e.workerName)}
                          </div>
                          <span className="style-name">{e.workerName}</span>
                        </div>
                      </td>
                      <td>{e.styleName}</td>
                      <td className="pe-qty">{e.qty}</td>
                      <td className="pe-rate">₹{e.rate}</td>
                      <td className="pe-amount">
                        ₹{e.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="pe-date">{formatDate(e.entryDate)}</td>
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
