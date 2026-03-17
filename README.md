<p align="center">
  <img src="public/Logo.jpeg" alt="StitchPay Logo" width="180" />
</p>

<p align="center">
  <a href="https://stitchpay.vercel.app">
    <img src="https://img.shields.io/badge/-stitchpay.vercel.app-c8f060?style=for-the-badge" />
  </a>
</p>

---

# StitchPay     

**StitchPay** is a production-driven payroll platform built for small and mid-scale garment manufacturing units. It enables businesses to track worker output, automate wage calculations, and manage payroll seamlessly from a unified dashboard.

By replacing manual record-keeping with a structured digital workflow, StitchPay brings accuracy, transparency, and efficiency to tailoring and garment stitching operations.

---

## Features

### Authentication
- Secure login and session management via Supabase Auth
- Auth guard on all dashboard routes — redirects unauthenticated users to login
- Session persistence with `onAuthStateChange` listener
- Password reset via email — sends a reset link to the user's registered email

<!-- <img src="public/imagename.png" alt="Feature Name" width="100%" /> -->

### Dashboard
- Live stat cards — Total Workers, Active Styles, Pieces This Month, Total Wages Due, Total Expenses Deducted, Production Margin, Finishing Margin, Total Vendor Revenue
- Smart delta indicators — % change vs last month for pieces, new worker/style counts
- Production Overview chart — area chart showing pieces completed per month across last 12 months
- Top Performers — top 4 workers by pieces completed this month
- Recent Production Entries — last 5 logged entries with worker, style, qty, rate, amount, date
- Quick Add dropdown — shortcut to Add Style, Add Worker, Log Entry from any page

### Styles Management
- Register garment styles with style number, name, category, company, and status
- Department-based vendor rates — set what the company pays per piece for Production and Finishing separately
- Role-based worker rates — set individual rates per role (Singer, Overlock, Flat, Thread Cutting, Ironing) per style
- Live margin preview in modal — shows Vendor Rate, Total Paid to Workers, and Your Margin as you type
- Filter by category, search by style name, style number, or company
- Export styles to CSV
- Edit and status toggle (Active / Inactive)

### Worker Management
- Add workers with ID, name, email, phone, department, role, and status
- Fixed departments — Production (Singer, Overlock, Flat) and Finishing (Thread Cutting, Ironing)
- Role dropdown auto-filters based on selected department
- Department badges with color coding in the table
- Filter by department and status, search by name, ID, or role
- This Month column — live piece count from production entries for the current month
- Export workers to CSV
- Edit and delete workers
- Active / On Leave / Inactive status per worker

### Production Entries
- Log production entries per worker per style with quantity
- Rate auto-lookup — pulls worker rate from `style_role_rates` based on worker's role and selected style
- Rate snapshot — rate is frozen at time of logging; future rate changes don't affect past entries
- Department and role snapshots stored on each entry
- Worker and style dropdowns show IDs alongside names
- Only Active workers & styles appear in the log entry dropdown
- Edit entries — only quantity is editable after logging; worker, style, and rate are locked
- Delete entries — blocked by DB trigger if worker has already been paid for that cycle
- Filter by worker and style, search by entry ID, worker name, or style name
- Export entries to CSV with department and role columns

### Payroll Calculation
- Auto-calculates gross wages per worker from production entries for the selected 15-day pay cycle
- 15-day cycle logic — 10th–25th and 25th–10th, auto-detects current cycle on load
- Switch between last 6 cycles using the cycle selector
- Per-worker breakdown — Styles Worked, Style ID, Total Pieces, Calculation (qty × rate = amount), Gross Wage, Status
- Recalculate button — re-fetches and recomputes on demand with last calculated timestamp
- Ready / No Data status per worker
- Export payroll breakdown to CSV

### Monthly Wages
- Auto-generates wage sheet from payroll calculations for the selected cycle
- Disbursement Summary card — total disbursed, paid count, pending count
- Expense / Deduction — set a single expense amount per worker per cycle (enter 0 if none)
- Net Wage — calculated as Gross Wage minus Expenses (generated column in DB)
- Mark Paid — marks worker as paid, sends wage receipt email via Gmail SMTP (Nodemailer)
- Email receipt — plain HTML email with Worker ID, Payment Date, Total Pieces, Gross Wage, Expenses, Net Wage
- Resend receipt — resend the stored receipt to the worker's email from the view modal
- View receipt — eye icon opens the stored receipt in an iframe modal
- Pieces and wages frozen after marking paid — new entries after payment don't affect paid records
- Inactive workers doesn't appear in the wage sheet
- Cycle switching — view and manage wages for any of the last 6 cycles
- Export wage sheet to CSV

### Database & Security
- Row Level Security (RLS) on all tables — users can only access their own data
- Unique constraints — style numbers, worker IDs, and entry IDs are unique per user
- Check constraints — fixed roles, departments, and statuses enforced at DB level
- Generated columns — `amount_earned` computed from `qty_completed × rate_per_piece`, `net_wage` from `gross_wage − expenses`
- DB trigger — prevents deleting production entries for workers who have already been paid for that cycle
- Composite indexes on `production_entries(worker_id, entry_date)` and `style_id` for fast payroll queries

---

## Tech Stack

### Frontend
![Next.js](https://img.shields.io/badge/Next.js%20%28App%20Router%29-000?style=flat-square&logo=nextdotjs)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=000)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Css](https://img.shields.io/badge/CSS-633194?style=flat-square&logo=css)

### Authentication
![Supabase](https://img.shields.io/badge/Supabase%20%28Auth%29-3ECF8E?style=flat-square&logo=supabase&logoColor=white)

### Backend / Database
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)

### Email Service
![Nodemailer](https://img.shields.io/badge/Nodemailer%20%28Gmail%20SMTP%29-EA4335?style=flat-square&logo=gmail&logoColor=white)

### Deployment
[![Vercel](https://img.shields.io/badge/Vercel-000?style=flat-square&logo=vercel)](https://stitchpay.vercel.app) [![Live](https://img.shields.io/badge/stitchpay.vercel.app-000?style=flat-square)](https://stitchpay.vercel.app)


---

## License

© 2026 StitchPay. All rights reserved.

This repository is publicly visible for portfolio purposes only. No permission is granted to use, copy, modify, or distribute this code for any purpose.