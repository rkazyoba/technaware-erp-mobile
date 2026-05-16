We are building the mobile UI for Technaware ERP — a full-suite ERP system 
for Tanzanian businesses. Implement a complete React Native mobile app with the following design system and using these four core screens for the entire implementation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Colors:
  Primary dark navy:   #0d1b3e
  Accent teal/green:   #00c896
  Background page:     #f0f2f5
  Surface (card):      #ffffff
  Text primary:        #111827
  Text secondary:      #6b7280
  Text muted:          #9ca3af
  Border subtle:       rgba(0,0,0,0.07)

Status badge colors:
  Approved:  bg #dcfce7, text #166534
  Pending:   bg #fef3c7, text #92400e
  Rejected:  bg #fee2e2, text #991b1b
  Draft:     bg #f3f4f6, text #4b5563

Typography:
  Headings:  500 weight
  Body:      400 weight, 14px
  Labels:    11–12px, #9ca3af
  Never use weight 600 or 700

Card style:
  background: white
  borderRadius: 14
  border: 0.5px solid rgba(0,0,0,0.07)
  padding: 12–14px

Bottom navigation: 4 tabs — Home, Modules, Payroll, Summary
  + floating action button (teal #00c896, 44px circle) centered above nav bar
  Active tab color: #0d1b3e

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 1 — HOME / DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Top bar (dark navy):
  - Left: Technaware logo icon (gear/brain) + "TECHNAWARE / We offer Solutions"
  - Right: notification bell icon with teal dot indicator

Greeting bar (dark navy, slightly lighter gradient):
  - "Good morning," (muted white)
  - User full name (white, 17px 500)
  - "Role · ERP Plan name" (muted, 11px)

Overview section — 2-column stat card grid:
  Card 1 (navy accent bg): "Revenue (TZS)" → value + trend vs last month
  Card 2: "Attention needed" → count + breakdown
  Card 3: "Logistics queue" → count + breakdown
  Card 4: "Work in progress" → count + breakdown

Quick actions section — 2-column grid of action buttons:
  Each button: white card, 14px icon (navy), label text
  Actions: New delivery note, New requisition, GRN (PO), Leave request

Approvals in queue section:
  List of 2–3 pending approval cards (compact, no action buttons here)
  Each card shows: record ID, title, submitter, date

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 2 — MODULE LIST (e.g. Delivery Notes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Top bar:
  - Left: back arrow + screen title (e.g. "Delivery notes")
  - Right: filter icon + teal (+) add button

Search bar: white card, search icon, placeholder "Search note no. or description…"

Filter chips row (horizontal scroll):
  All · Approved · Pending · Draft · Unfinished
  Active chip: navy bg + white text

Count label: "X delivery notes" in muted uppercase section label

Record list — one card per row:
  - Record ID (navy, 12px 500) + status badge (right-aligned)
  - Title (13px 500)
  - Customer name + prepared by + despatch date (muted 11px)
  Tap navigates to Detail screen

Modules available (pill chips on Modules tab):
  Notifications, Approvals, Leave Requests, Requisitions, Attendance,
  Support, Part catalog, Stock by store, GRN (PO), Non-PO receipts,
  Supplier returns, Pick tickets, Delivery notes, Store movements, My Payslips

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 3 — RECORD DETAIL VIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Top bar:
  - Left: back arrow + "Delivery Note" (or relevant module title)
  - Right: share icon + kebab menu (three-dot)

Hero header (dark navy bg, no border radius):
  - Record number in muted uppercase (e.g. DN2600001)
  - Full record title (white, 16px 500)
  - Tag pills: status (teal for approved, amber for pending), 
    customer name, despatch date

Details section — white info card with divider rows:
  Each row: left = icon + label (muted), right = value (dark)
  Fields: Note no., Customer (blue tappable), Prepared date, 
  Despatch date, Order no., Prepared by

Line items section — one card per item:
  - Item name + quantity (right, navy)
  - SKU and unit below in muted text

Approval trail section — timeline component:
  Each step: colored dot (green=done, amber=pending) + vertical line connector
  Step content: person name (500), role/action, timestamp

Action bar (bottom, above nav):
  Two buttons side by side:
    Left: "Edit" — white outlined button with edit icon
    Right: "Print PDF" — navy filled button with printer icon

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 4 — APPROVALS QUEUE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Top bar:
  - Left: back arrow + "Approvals"
  - Right: filter icon

Summary banner (white card, 4 columns):
  Pending (amber number) · Approved (green) · Rejected (red) · Total (navy)

Filter chips (horizontal scroll):
  All · Requisitions · Invoices · PO receipts · Delivery notes

"Awaiting your action" section:
  Each approval card contains:
    - Title (flex) + record type pill (gray, right-aligned)
    - Record ID · Submitted by · Date (muted)
    - Amount or reference (navy, 14px 500)
    - Three action buttons in a row:
        View (gray bg)  |  Approve (green bg)  |  Reject (red bg)
      Each with matching icon (eye / check / x)

"Recently approved" section:
  Compact cards — title + approved badge (right) + "Approved by you · date" below
  No action buttons on already-processed records

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NAVIGATION & INTERACTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Bottom nav always visible (Home, Modules, Payroll, Summary)
- Floating action button (center, above nav) opens a bottom sheet with 
  quick-create options: New Delivery Note, New Requisition, New Leave Request
- All list screens support pull-to-refresh
- Approval Approve/Reject actions show a confirmation bottom sheet before 
  executing, with optional notes/reason field for rejection
- Status badges are consistent across all screens using the same color tokens
- Record IDs and customer names are tappable links (navy blue color)
- All monetary values formatted with TZS prefix and thousand separators

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BRANDING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

App name: Technaware ERP Mobile
Tagline: We offer Solutions
Footer text on splash/login: "© 2026 Technaware Solutions"
Login screen: dark navy gradient background with grid line pattern, 
  centered white card, username + password fields, 
  "Sign in" button with teal-to-cyan gradient