# PROJECT_BRIEF.md — Suthra Punjab e-Challan Management System

## What this is
A full-stack replacement for a front-end-only demo. It issues digital "e-Challan"
warning notices for waste-management violations. Two roles: Admin and Enforcement
Inspector.

## Roles
- ADMIN: manages inspector accounts, views all challans, views analytics. Does not
  fill challan forms.
- INSPECTOR: logs in, fills the challan form for a citizen, prints/downloads the
  receipt. Only sees their own account, not the admin views.

## Data model
users
- id, name, cnic (format 00000-0000000-0), contact_no
- town (required for INSPECTOR, nullable for ADMIN)
- username (unique, login credential), password_hash (bcrypt)
- role: ADMIN | INSPECTOR
- status: ACTIVE | INACTIVE  (inactive users cannot log in)
- created_at

challans
- id, notice_no (unique, format "SPA-001", "SPA-002", ... — see rule below)
- created_by_user_id (FK -> users)
- inspector_name, inspector_id, town   <- copied from the user at creation time
  (so historical records stay accurate even if a user's town assignment changes later)
- datetime (the violation's date/time, entered by the inspector)
- location, uc, zone, tehsil, district
- citizen_name, citizen_cnic, citizen_phone, citizen_address
- violation_description (one of the fixed 15 categories below — store the exact string)
- warning_count
- created_at (server timestamp when the record was saved)

notice_counter
- single row, integer value, incremented atomically (see rule below)

## Violation categories (fixed list — exact wording, used in a dropdown)
1. Illegal Sewage or Drainage Discharge
2. Prohibited Carcass Disposal
3. Improper Offal and Animal Waste Disposal
4. Public Littering and Waste Dumping
5. Failure to Provide Premises Waste Disposal
6. Uncleaned Premises Frontage
7. Unmaintained Latrines, Urinals, or Drains
8. Plastic and Non-Perishable Waste Accumulation
9. Non-Compliance with Agency Directives
10. Unlicensed Waste Collection or Sorting
11. Environmental Pollution and Health Hazard
12. Abetment or Attempt of Offense
13. Solid Waste Burning
14. Obstruction of Waste Management Officers
15. Tyre Burning

## Notice number rule
Format: SPA-001, SPA-002, SPA-003 ... zero-padded to at least 3 digits, expanding
naturally past 999 (SPA-1000, etc). Assigned by the backend, exactly once, at the
moment a challan is saved. Never editable by the user. Never generated on the
client. Must be race-condition safe: two inspectors submitting at the same instant
must never get the same number or cause a gap. A naive "SELECT MAX(id)+1" is NOT
acceptable here — use an atomic counter/transaction.

## The challan form and printed receipt — do not redesign
The uploaded demo files (index.html #challan-preview block, app.js printChallan()
and generatePDF()) define the exact printed/PDF receipt layout: an 80mm-wide
thermal-receipt-style notice with government logos, the fixed legal text, and the
data fields listed above. This visual structure, its fonts, and its print/PDF
behavior (window.print() flow, html2canvas + jsPDF at 80mm width) must be
reproduced exactly. Only change: Notice No. is now read-only and server-assigned
instead of a free-text field, and submission now saves to the database instead of
posting to a Google Sheet.

## Design direction
Light mode only. No purple-to-blue gradients, no glassmorphism, no neon glow
effects, no generic "AI SaaS" look. Aim for a flagship feel comparable to
Claude.ai, Google Workspace admin console, Microsoft 365, or Outlook: clean
typography (Inter or Geist), generous whitespace, a neutral off-white/gray
background with one restrained accent color, subtle borders/shadows instead of
heavy effects. Fully responsive — usable on both desktop and mobile, sidebar
collapses to a bottom nav or hamburger on small screens.

## Tech stack
Next.js (App Router) + TypeScript, Tailwind CSS + shadcn/ui, PostgreSQL via
Prisma, custom username/password auth (bcrypt + JWT in an httpOnly cookie, role-
based middleware on /admin/* and /inspector/*), Recharts for charts, react-hook-
form + zod for validation.

## Assumptions locked in for this build
- Login = username + password. CNIC is profile data, not the login secret.
- Inspector Name / ID / Town auto-fill from the session and are read-only on the
  form.
- Admin's search bar matches across both citizen and inspector name/CNIC/phone.
- "Live" analytics = poll/refresh every 15-30 seconds.