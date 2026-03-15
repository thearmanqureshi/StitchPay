"use client";

import { useState, useEffect } from "react";
import Header from "@/components/dashboard/Header";
import { supabase } from "@/lib/supabase/client";
import AddWorkerModal from "@/components/dashboard/workers/addworkers";
import "@/app/dashboard.css";

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

const STATUSES = ["All Status", "Active", "Inactive", "On Leave"];
const DEPARTMENTS = ["All Departments", "Production", "Finishing"];

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [monthlyOutput, setMonthlyOutput] = useState<Record<string, number>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [showModal, setShowModal] = useState(false);
  const [editWorker, setEditWorker] = useState<Worker | null>(null);

  const fetchWorkers = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("workers")
      .select("*")
      .order("worker_id", { ascending: true });

    if (!error && data) {
      setWorkers(data);
      await fetchMonthlyOutput(data.map((w) => w.id));
    }

    setLoading(false);
  };

  const fetchMonthlyOutput = async (workerIds: string[]) => {
    if (workerIds.length === 0) return;

    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).toISOString();
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    ).toISOString();

    const { data, error } = await supabase
      .from("production_entries")
      .select("worker_id, qty_completed")
      .in("worker_id", workerIds)
      .gte("entry_date", startOfMonth)
      .lte("entry_date", endOfMonth);

    if (!error && data) {
      const output: Record<string, number> = {};
      data.forEach((entry) => {
        output[entry.worker_id] =
          (output[entry.worker_id] ?? 0) + entry.qty_completed;
      });
      setMonthlyOutput(output);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleExport = () => {
    const rows = [
      [
        "Worker ID",
        "Name",
        "Email",
        "Phone",
        "Department",
        "Role",
        "This Month (pcs)",
        "Status",
      ],
      ...filteredWorkers.map((w) => [
        w.worker_id,
        w.name,
        w.email,
        w.phone,
        w.department,
        w.role,
        monthlyOutput[w.id] ?? 0,
        w.status,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredWorkers = workers.filter((w) => {
    const matchSearch =
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.worker_id.toLowerCase().includes(search.toLowerCase()) ||
      w.role.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "All Status" || w.status === statusFilter;
    const matchDept =
      deptFilter === "All Departments" || w.department === deptFilter;
    return matchSearch && matchStatus && matchDept;
  });

  const statusClass = (status: string) => {
    if (status === "Active") return "badge badge-active";
    if (status === "On Leave") return "badge badge-leave";
    return "badge badge-inactive";
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : (parts[0]?.slice(0, 2) ?? "??");
  };

  return (
    <>
      <Header
        title="Workers"
        section="Management"
        subSection="Workers"
        exportAction={{ label: "Export", onClick: handleExport }}
        action={{
          label: "Add Worker",
          onClick: () => {
            setEditWorker(null);
            setShowModal(true);
          },
        }}
      />

      <div className="page-content">
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

          {/* Department filter */}
          <div className="filter-select-wrapper">
            <svg
              className="filter-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
            <select
              className="filter-select"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
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

          {/* Status filter */}
          <div className="filter-select-wrapper">
            <svg
              className="filter-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
            </svg>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
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
        </div>

        <div className="table-card">
          <div className="table-card-header">
            <div>
              <h2 className="table-card-title">Workforce</h2>
              <p className="table-card-sub">
                {filteredWorkers.length}{" "}
                {filteredWorkers.length === 1 ? "worker" : "workers"} registered
              </p>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="styles-table">
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>ID</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>This Month</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="table-empty">
                      <div className="table-loading">
                        <div className="spinner" />
                        Loading workers...
                      </div>
                    </td>
                  </tr>
                ) : filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="table-empty">
                      No workers found
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map((worker) => (
                    <tr key={worker.id}>
                      <td>
                        <div className="worker-cell">
                          <div className="worker-avatar">
                            {getInitials(worker.name).toUpperCase()}
                          </div>
                          <div className="worker-info">
                            <p className="worker-name">{worker.name}</p>
                            <p className="worker-email">{worker.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="style-no">{worker.worker_id}</td>
                      <td className="worker-phone">{worker.phone}</td>
                      <td>
                        <span
                          className={`badge ${worker.department === "Production" ? "badge-dept-prod" : "badge-dept-fin"}`}
                        >
                          <span className="badge-dot" />
                          {worker.department}
                        </span>
                      </td>
                      <td>{worker.role}</td>
                      <td className="style-rate">
                        {monthlyOutput[worker.id] ?? 0} pcs
                      </td>
                      <td>
                        <span className={statusClass(worker.status)}>
                          <span className="badge-dot" />
                          {worker.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="action-btn"
                          onClick={() => {
                            setEditWorker(worker);
                            setShowModal(true);
                          }}
                          title="Edit worker"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
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
        <AddWorkerModal
          worker={editWorker}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            fetchWorkers();
          }}
        />
      )}
    </>
  );
}
