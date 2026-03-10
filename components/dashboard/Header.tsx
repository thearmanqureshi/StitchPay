"use client";

interface HeaderProps {
  title: string;
  section: string;
  subSection?: string;
  exportAction?: {
    label: string;
    onClick: () => void;
  };
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function Header({
  title,
  section,
  subSection,
  exportAction,
  action,
}: HeaderProps) {
  const month = new Date().toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="topbar">
      {/* Spacer matching hamburger button width on mobile */}
      <div className="topbar-hamburger-slot" />

      <div className="topbar-left">
        <div className="topbar-title">{title}</div>
        <div className="topbar-breadcrumb">
          <span>StitchPay</span> › {section}
          {subSection && (
            <>
              {" "}
              › <span>{subSection}</span>
            </>
          )}
        </div>
      </div>

      <div className="topbar-right">
        <div className="month-badge">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          {month}
        </div>

        {exportAction && (
          <button className="btn-sm ghost" onClick={exportAction.onClick}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span className="btn-label">{exportAction.label}</span>
          </button>
        )}

        {action && (
          <button className="btn-sm primary" onClick={action.onClick}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="btn-label">{action.label}</span>
          </button>
        )}
      </div>
    </div>
  );
}
