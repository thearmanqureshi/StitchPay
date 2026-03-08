"use client";

export default function Header({ title }: { title: string }) {
  const month = new Date().toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        <div className="topbar-breadcrumb">
          <span>StitchPay</span> › {title}
        </div>
      </div>

      <div className="topbar-right">
        <div className="month-badge">{month}</div>

        <button className="btn-sm primary">
          + Add
        </button>
      </div>
    </div>
  );
}