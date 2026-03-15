# StitchPay     

**StitchPay** is a payroll and production management platform designed for small and mid-scale garment manufacturing units. It helps organizations track worker production, calculate wages, and manage payroll efficiently from a single dashboard.

The system replaces manual record-keeping with a structured digital workflow tailored for tailoring and garment stitching businesses.

---

# Features

## Authentication
- Secure login and session management via Supabase Auth
- Auth guard on all dashboard routes — redirects unauthenticated users to login
- Session persistence with `onAuthStateChange` listener

## Dashboard
- Live stat cards — Total Workers, Active Styles, Pieces This Month, Total Wages Due
- Smart delta indicators — % change vs last month for pieces, new worker/style counts
- Production Overview chart — area chart showing pieces completed per month across last 12 months
- Top Performers — top 4 workers by pieces completed this month
- Recent Production Entries — last 5 logged entries with worker, style, qty, rate, amount, date
- Quick Add dropdown — shortcut to Add Style, Add Worker, Log Entry from any page

## Styles Management
- Register garment styles with style number, name, category, company, and status
- Department-based vendor rates — set what the company pays per piece for Production and Finishing separately
- Role-based worker rates — set individual rates per role (Singer, Overlock, Flat, Thread Cutting, Ironing) per style
- Live margin preview in modal — shows Vendor Rate, Total Paid to Workers, and Your Margin as you type
- Filter by category, search by style name, style number, or company
- Export styles to CSV
- Edit and status toggle (Active / Inactive)

## Worker Management
- Add workers with ID, name, email, phone, department, role, and status
- Fixed departments — Production (Singer, Overlock, Flat) and Finishing (Thread Cutting, Ironing)
- Role dropdown auto-filters based on selected department
- Department badges with color coding in the table
- Filter by department and status, search by name, ID, or role
- This Month column — live piece count from production entries for the current month
- Export workers to CSV
- Edit and delete workers

## Production Entries
- Log production entries per worker per style with quantity
- Rate auto-lookup — pulls worker rate from `style_role_rates` based on worker's role and selected style
- Rate snapshot — rate is frozen at time of logging; future rate changes don't affect past entries
- Department and role snapshots stored on each entry
- Worker and style dropdowns show IDs alongside names
- Only Active workers appear in the log entry dropdown
- Edit entries — only quantity is editable after logging; worker, style, and rate are locked
- Delete entries — blocked by DB trigger if worker has already been paid for that cycle
- Filter by worker and style, search by entry ID, worker name, or style name
- Export entries to CSV with department and role columns

## Payroll Calculation
- Auto-calculates gross wages per worker from production entries for the selected 15-day pay cycle
- 15-day cycle logic — 10th–25th and 25th–10th, auto-detects current cycle on load
- Switch between last 6 cycles using the cycle selector
- Per-worker breakdown — Styles Worked, Style ID, Total Pieces, Calculation (qty × rate = amount), Gross Wage, Status
- Recalculate button — re-fetches and recomputes on demand with last calculated timestamp
- Ready / No Data status per worker
- Export payroll breakdown to CSV

## Monthly Wages
- Auto-generates wage sheet from payroll calculations for the selected cycle
- Disbursement Summary card — total disbursed, paid count, pending count
- Expense / Deduction — set a single expense amount per worker per cycle (enter 0 if none)
- Net Wage — calculated as Gross Wage minus Expenses (generated column in DB)
- Mark Paid — marks worker as paid, sends wage receipt email via Gmail SMTP (Nodemailer)
- Email receipt — plain HTML email with Worker ID, Payment Date, Total Pieces, Gross Wage, Expenses, Net Wage
- Resend receipt — resend the stored receipt to the worker's email from the view modal
- View receipt — eye icon opens the stored receipt in an iframe modal
- Pieces and wages frozen after marking paid — new entries after payment don't affect paid records
- Cycle switching — view and manage wages for any of the last 6 cycles
- Export wage sheet to CSV

## Database & Security
- Row Level Security (RLS) on all tables — users can only access their own data
- Unique constraints — style numbers, worker IDs, and entry IDs are unique per user
- Check constraints — fixed roles, departments, and statuses enforced at DB level
- Generated columns — `amount_earned` computed from `qty_completed × rate_per_piece`, `net_wage` from `gross_wage − expenses`
- DB trigger — prevents deleting production entries for workers who have already been paid for that cycle
- Composite indexes on `production_entries(worker_id, entry_date)` and `style_id` for fast payroll queries

---

# Tech Stack

## Frontend
- Next.js (App Router)
- React
- TypeScript
- CSS

## Authentication
- Supabase Auth

## Backend / Database
- Supabase
- PostgreSQL

## Email Service
- Gmail SMTP via Nodemailer

## Deployment
- Vercel -> https://stitchpay.vercel.app

---

# 📌 Project Status

Currently under active development.

All Core modules implemented:
- Authentication
- Dashboard
- Styles
- Workers
- Production Entries
- Payroll Calculation
- Monthly Wages

Upcoming:
- Live Testing in production & Improving issues found

---

## Getting Started
1. Clone the repo
2. Install dependencies: `npm install`
3. Create `.env.local` and fill in your keys
4. Run: `npm run dev`

---

## Environment Variables
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GMAIL_USER=
GMAIL_APP_PASSWORD=

---

# Project Structure

---

# Future Improvements

---