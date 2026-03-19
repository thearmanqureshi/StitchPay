"use client";

import { useState, useMemo, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
  subLabel?: string; // optional (role, department, style_no, etc.)
}

interface Props {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Search...",
  disabled = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    return options.filter((o) =>
      `${o.label} ${o.subLabel || ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }, [search, options]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Extract last 4 digits from a subLabel string e.g. "Style No: CT04251664" → "1664"
  const getLast4Digits = (subLabel: string) =>
    subLabel.replace(/\D/g, "").slice(-4);

  return (
    <div className="searchable-select" ref={containerRef}>
      {/* Input */}
      <input
        type="text"
        value={
          open
            ? search
            : selected
            ? selected.subLabel && getLast4Digits(selected.subLabel)
              ? `${selected.label} (${getLast4Digits(selected.subLabel)})`
              : selected.label
            : ""
        }
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        disabled={disabled}
      />

      {/* Dropdown */}
      {open && !disabled && (
        <div className="dropdown">
          {filtered.length > 0 ? (
            filtered.map((o) => (
              <div
                key={o.value}
                className={`dropdown-item ${value === o.value ? "active" : ""}`}
                onClick={() => {
                  onChange(o.value);
                  setSearch("");
                  setOpen(false);
                }}
              >
                <div className="label">
                  {o.label}
                </div>
                {o.subLabel && <div className="sublabel">{o.subLabel}</div>}
              </div>
            ))
          ) : (
            <div className="dropdown-empty">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}