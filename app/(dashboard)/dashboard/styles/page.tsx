"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/dashboard/Header";
import { supabase } from "@/lib/supabase/client";
import AddStyleModal from "@/components/dashboard/styles/addstyles";
import "@/app/styles.css";

interface Style {
  id: string;
  style_no: string;
  style_name: string;
  category: string;
  rate_per_piece: number;
  company: string;
  status: "Active" | "Inactive";
}

const CATEGORIES = [
  "All Categories",
  "Tops",
  "Bottoms",
  "Ethnic",
  "Kids",
  "Other",
];

export default function StylesPage() {
  const router = useRouter();
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [showModal, setShowModal] = useState(false);
  const [editStyle, setEditStyle] = useState<Style | null>(null);

  const fetchStyles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("styles")
      .select("*")
      .order("style_no", { ascending: true });

    if (!error && data) setStyles(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchStyles();
  }, []);

  const handleExport = () => {
    const rows = [
      [
        "Style No",
        "Style Name",
        "Category",
        "Rate / Piece",
        "Company",
        "Status",
      ],
      ...filteredStyles.map((s) => [
        s.style_no,
        s.style_name,
        s.category,
        s.rate_per_piece,
        s.company,
        s.status,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "styles.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredStyles = styles.filter((s) => {
    const matchSearch =
      s.style_name.toLowerCase().includes(search.toLowerCase()) ||
      s.style_no.toLowerCase().includes(search.toLowerCase()) ||
      s.company.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      category === "All Categories" || s.category === category;
    return matchSearch && matchCategory;
  });

  const statusClass = (status: string) => {
    if (status === "Active") return "badge badge-active";
    return "badge badge-inactive";
  };

  return (
    <>
      <Header
        title="Styles"
        section="Management"
        subSection="Styles"
        exportAction={{ label: "Export", onClick: handleExport }}
        action={{
          label: "Add Style",
          onClick: () => {
            setEditStyle(null);
            setShowModal(true);
          },
        }}
      />

      <div className="page-content">
        {/* Filters */}
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
              placeholder="Search styles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

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
              <rect x="3" y="3" width="5" height="5" rx="1" />
              <rect x="3" y="10" width="5" height="5" rx="1" />
              <rect x="3" y="17" width="5" height="5" rx="1" />
              <line x1="11" y1="5.5" x2="21" y2="5.5" />
              <line x1="11" y1="12.5" x2="21" y2="12.5" />
              <line x1="11" y1="19.5" x2="21" y2="19.5" />
            </svg>
            <select
              className="filter-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
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

        {/* Table Card */}
        <div className="table-card">
          <div className="table-card-header">
            <div>
              <h2 className="table-card-title">Product Styles</h2>
              <p className="table-card-sub">
                {filteredStyles.length}{" "}
                {filteredStyles.length === 1 ? "style" : "styles"} · piece-rate
                catalog
              </p>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="styles-table">
              <thead>
                <tr>
                  <th>Style No.</th>
                  <th>Style Name</th>
                  <th>Category</th>
                  <th>Rate / Piece</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="table-empty">
                      <div className="table-loading">
                        <div className="spinner" />
                        Loading styles...
                      </div>
                    </td>
                  </tr>
                ) : filteredStyles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="table-empty">
                      No styles found
                    </td>
                  </tr>
                ) : (
                  filteredStyles.map((style) => (
                    <tr key={style.id}>
                      <td className="style-no">{style.style_no}</td>
                      <td className="style-name">{style.style_name}</td>
                      <td>{style.category}</td>
                      <td className="style-rate">₹{style.rate_per_piece}</td>
                      <td>{style.company}</td>
                      <td>
                        <span className={statusClass(style.status)}>
                          <span className="badge-dot" />
                          {style.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="action-btn"
                          onClick={() => {
                            setEditStyle(style);
                            setShowModal(true);
                          }}
                          title="Edit style"
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
        <AddStyleModal
          style={editStyle}
          categories={CATEGORIES.filter((c) => c !== "All Categories")}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            fetchStyles();
          }}
        />
      )}
    </>
  );
}
