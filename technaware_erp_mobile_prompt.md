# Technaware ERP Mobile — Cursor Implementation Prompt

> **How to use this file:** Paste the full contents into Cursor as your project prompt.
> Attach all reference images listed in each section alongside this file.

---

## Project Overview

Build the mobile UI for **Technaware ERP** — a full-suite ERP system for Tanzanian businesses.
Implement a complete **React Native** mobile app using Expo. The app connects to an existing
web-based ERP backend (already live). This document defines every screen, component, interaction,
and design token required for a pixel-faithful implementation.

**Reference images to attach:**
| Image | File | Shows |
|---|---|---|
| IMG-01 | `1778753676395_image.png` | Login screen (web) |
| IMG-02 | `1778753715494_image.png` | Dashboard / home (web) |
| IMG-03 | `1778753777659_image.png` | Add Delivery Note form (web) |
| IMG-04 | `1778753811223_image.png` | Delivery Notes list (web) |
| IMG-05 | `1778753919502_image.png` | Mobile home screen (current) |
| IMG-06 | `1778753934461_image.png` | Mobile home — menu chips (current) |
| IMG-07 | `1778753951314_image.png` | Mobile modules — GRN (PO) active (current) |
| IMG-08 | `1778753960801_image.png` | Mobile GRN list with records (current) |

Use IMG-01 through IMG-04 to understand the web app's data structures, field names, and
terminology. Use IMG-05 through IMG-08 to understand the current mobile layout that this
redesign replaces. The new design described below supersedes the current mobile UI entirely.

---

## Design System

### Color Tokens

```
PRIMARY_NAVY      #0d1b3e   ← top bars, accent cards, filled buttons
ACCENT_TEAL       #00c896   ← FAB, active indicators, teal tags
PAGE_BG           #f0f2f5   ← screen background
SURFACE           #ffffff   ← all cards
TEXT_PRIMARY      #111827
TEXT_SECONDARY    #6b7280
TEXT_MUTED        #9ca3af
BORDER_SUBTLE     rgba(0,0,0,0.07)
```

**Status badge tokens (use consistently on every screen):**
```
Approved  → bg #dcfce7  text #166534
Pending   → bg #fef3c7  text #92400e
Rejected  → bg #fee2e2  text #991b1b
Draft     → bg #f3f4f6  text #4b5563
Unfinished→ bg #f3f4f6  text #4b5563
```

**Module icon color families:**
```
navy    → bg rgba(13,27,62,0.08)   icon #0d1b3e
teal    → bg rgba(0,200,150,0.12)  icon #00a87a
amber   → bg rgba(217,119,6,0.1)   icon #b45309
blue    → bg rgba(29,78,216,0.1)   icon #1d4ed8
purple  → bg rgba(109,40,217,0.1)  icon #7c3aed
coral   → bg rgba(220,38,38,0.08)  icon #dc2626
green   → bg rgba(22,163,74,0.1)   icon #16a34a
slate   → bg rgba(71,85,105,0.1)   icon #475569
```

### Typography

```
Font family: System default (SF Pro on iOS, Roboto on Android)
Heading:     fontWeight 500  — never use 600 or 700
Body:        fontWeight 400, fontSize 14
Label/meta:  fontSize 11–12, color TEXT_MUTED
```

### Card Style

```
backgroundColor: #ffffff
borderRadius:    14
borderWidth:     0.5
borderColor:     rgba(0,0,0,0.07)
padding:         12–14px
```

### Shared Components

**StatusBadge** — reusable across all screens:
```
borderRadius: 20
paddingHorizontal: 8
paddingVertical: 2
fontSize: 9
fontWeight: 500
```

**SectionLabel** — uppercase muted category divider:
```
fontSize: 11
fontWeight: 500
color: TEXT_MUTED
letterSpacing: 0.06em
paddingHorizontal: 16
paddingVertical: 8 (top 12)
textTransform: uppercase
```

**TopBar** — used on every screen:
```
backgroundColor: PRIMARY_NAVY
paddingHorizontal: 16
paddingVertical: 12–14
flexDirection: row
alignItems: center
justifyContent: space-between
IconButton: 32×32, borderRadius 50%, bg rgba(255,255,255,0.1), color white
```

**BottomNavigation** — always visible, 4 tabs + FAB:
```
Tabs: Home | Modules | [FAB] | Payroll | Summary
backgroundColor: #ffffff
borderTopWidth: 0.5
borderTopColor: rgba(0,0,0,0.08)
paddingBottom: 14 (safe area)
Active tab color: PRIMARY_NAVY
Inactive tab color: TEXT_MUTED
FAB: 44×44, borderRadius 50%, bg ACCENT_TEAL, color white,
     position absolute, top -18, centered, border 3px white
FAB tap → opens bottom sheet with quick-create options
```

---

## Screen 1 — Login

> Reference: IMG-01 (web login). Adapt to mobile.

**Background:** Dark navy (`#0d1b3e`) full screen with subtle grid-line pattern overlay
(white lines, ~5% opacity, 40px grid spacing).

**Logo card** (centered, top third):
- White rounded card (borderRadius 16, padding 16 24)
- Gear/brain icon + "TECHNAWARE" bold + "We offer Solutions" subtitle

**Login card** (centered, middle):
- White rounded card (borderRadius 16, padding 24)
- Title: "Welcome back" (18px, 500)
- Subtitle: "Sign in with your username and password to continue." (muted, 13px)
- USERNAME field: label above, white input, borderRadius 10
- PASSWORD field: label above, white input with show/hide eye toggle, borderRadius 10
- Row: "Remember me" checkbox (left) + "Forgot password?" link (right, teal)
- Sign in button: full width, borderRadius 10, teal-to-cyan gradient
  (`#00c896` → `#00b4d8`), white text 15px 500

**Footer:** "© 2026 Technaware Solutions" centered, muted, 11px

---

## Screen 2 — Home / Dashboard

> Reference: IMG-02 (web dashboard), IMG-05 (current mobile home).

### Top Bar
- Left: gear icon (28×28 white rounded square, navy icon) + "TECHNAWARE" white 13px 500
  with "We offer Solutions" below in rgba(255,255,255,0.55) 9px
- Right: bell icon button with ACCENT_TEAL notification dot (7px, border 1.5px navy)

### Greeting Bar (still navy, slightly lighter: `#1a2d5a`)
```
"Good morning,"          → rgba(255,255,255,0.7), 12px
User full name           → white, 17px, 500
"Role · ERP Plan name"  → rgba(255,255,255,0.55), 11px
```

### Overview — 2-column stat card grid (padding 16, gap 8)

| Card | Style | Fields |
|---|---|---|
| Revenue (TZS) | Navy accent bg (`#0d1b3e`) | Label, large value, trend arrow + % vs last month |
| Attention needed | White card | Count, "X invoices · Y overdue" |
| Logistics queue | White card | Count, "X notes · Y PO receipts" |
| Work in progress | White card | Count, "X req · Y POs" |

Trend down arrow: color `#ef4444`, fontSize 9

### Quick Actions — 2-column grid (padding 16, gap 8)
Each action button:
```
White card, borderRadius 14, padding 12
flexDirection: row, alignItems: center, gap 8
Icon: 16px, color PRIMARY_NAVY
Label: 12px, fontWeight 500, color TEXT_PRIMARY
```
Actions: New delivery note · New requisition · GRN (PO) · Leave request

### Approvals in Queue — compact preview list
Section label + 2–3 cards (no action buttons):
```
Record ID (navy 12px 500) | Status badge (right)
Title (13px 500)
"Submitted by Name · Date" (muted 11px)
```
Tap → navigates to Approvals screen (Screen 5)

---

## Screen 3 — Modules Navigation

> Reference: IMG-06 (current module chips), IMG-07 (current active module).
> This replaces the flat chip list with a structured, categorised navigation.

The Modules tab has **two view modes** toggled by an icon in the top bar (grid ↔ list).

### Top Bar
- Title: "Modules"
- Right: toggle-view icon + search icon

### Recently Used Strip (horizontal scroll, below search bar)
5 circular icon chips showing the user's last-accessed modules:
```
Icon: 48×48, borderRadius 14, category color bg
Label: below, 10px, TEXT_SECONDARY, max 2 lines, centered
```

### Grid View (default) — 2-column cards per category

Each module card:
```
White card, borderRadius 14, padding 14 12 12
Icon container: 36×36, borderRadius 10, category color
Module name: 12px, fontWeight 500, TEXT_PRIMARY
Badge (if applicable): count badge bottom-left
```

### List View — grouped rows per category

Each row:
```
Icon (36×36) | Name (13px 500) + description (11px muted) | Badge? + chevron
Divider: 0.5px between rows within same card
```

### Module Categories & Assignments

**Inventory & Logistics** (6 modules):
| Module | Icon | Color | Badge |
|---|---|---|---|
| Delivery notes | truck-delivery | navy | pending count |
| GRN (PO) | clipboard-check | teal | doc count |
| Non-PO receipts | receipt-2 | green | — |
| Supplier returns | arrow-back-up | slate | — |
| Pick tickets | ticket | amber | — |
| Store movements | arrows-exchange | blue | — |
| Stock by store | building-store | navy | — |

**Procurement** (2 modules):
| Module | Icon | Color | Badge |
|---|---|---|---|
| Requisitions | shopping-cart | blue | open count |
| Part catalog | books | teal | — |

**HR & Payroll** (3 modules):
| Module | Icon | Color | Badge |
|---|---|---|---|
| My Payslips | file-invoice | purple | — |
| Leave requests | calendar-off | green | — |
| Attendance | clock | amber | — |

**Workflow & Comms** (3 modules):
| Module | Icon | Color | Badge |
|---|---|---|---|
| Approvals | checks | amber | pending count (red badge) |
| Notifications | bell | coral | unread count (red badge) |
| Support | headset | slate | — |

### Category Divider Style
```
flexDirection: row, alignItems: center, gap 8
Text: 10px, fontWeight 500, TEXT_MUTED, uppercase, letterSpacing 0.07
Line: flex 1, height 0.5, bg rgba(0,0,0,0.08)
paddingHorizontal: 16, paddingVertical: 12 (top)
```

---

## Screen 4 — Module Record List (e.g. Delivery Notes)

> Reference: IMG-04 (web delivery notes list), IMG-08 (current mobile GRN list).

This screen is **reused for every module** — the title, fields, and filter chips adapt
per module. The layout and component structure stay identical.

### Top Bar
- Left: back arrow + module title (e.g. "Delivery notes")
- Right: filter icon + teal add button (32×32, borderRadius 50%, bg ACCENT_TEAL)

### Search Bar (margin 12 16)
```
White card, borderRadius 12, padding 9 12
Search icon (16px, muted) + placeholder text
```

### Filter Chips (horizontal scroll, padding 0 16)
```
Chip: white bg, 0.5px border, borderRadius 20, padding 6 12, fontSize 11
Active chip: bg PRIMARY_NAVY, color white, borderColor PRIMARY_NAVY
Chips: All · Approved · Pending · Draft · Unfinished
```

### Count Label
`SectionLabel` component: "1,621 delivery notes"

### Record Cards (one per row, margin 0 16 8)
```
Record ID: navy, 12px, 500           Status badge: right-aligned
Title: 13px, 500, TEXT_PRIMARY
Customer · Prepared by · Date: 11px, TEXT_MUTED
```
Tap → navigates to Detail screen (Screen 5)

### Pull-to-Refresh
Implemented on all list screens using RefreshControl with ACCENT_TEAL color.

---

## Screen 5 — Record Detail View

> Reference: IMG-03 (web Add Delivery Note form — field names & structure).

### Top Bar
- Left: back arrow + module title
- Right: share icon + kebab menu (three-dot, opens action sheet)

### Hero Header (PRIMARY_NAVY bg, no border radius, padding 16)
```
Record number: rgba(255,255,255,0.55), 11px, uppercase, letterSpacing 0.05
Record title:  white, 16px, 500
Tag pills row (flexWrap: wrap, gap 6, marginTop 8):
  - Status pill (teal bg for Approved, amber for Pending)
  - Customer name pill
  - Despatch date pill
  All pills: rgba(255,255,255,0.12) bg, rgba(255,255,255,0.8) text, 10px
```

### Details Section — white info card, divider rows
```
Each row: paddingVertical 11, paddingHorizontal 14
  Left:  icon (14px, muted) + label (12px, TEXT_MUTED), gap 6
  Right: value (13px, 500, TEXT_PRIMARY)
Border: 0.5px between rows
```
Fields displayed (adapt per module):
- Note no. / Record ID
- Customer (color: `#1d4ed8`, tappable → customer detail)
- Prepared date
- Despatch date
- Order no.
- Prepared by

### Line Items Section — one card per item
```
Item name (13px, 500) + quantity right (13px, 500, navy)
SKU · Unit (11px, TEXT_MUTED, marginTop 3)
```

### Approval Trail — timeline component
```
Each step:
  Dot: 10×10, borderRadius 5
    done    → bg #16a34a
    pending → bg #d97706, border 2px #fcd34d
  Line: width 1, bg rgba(0,0,0,0.1), flex 1 (connects dot to next dot)
  Content (flex 1):
    Name: 12px, 500, TEXT_PRIMARY
    Role/action: 11px, TEXT_MUTED
    Timestamp: 10px, TEXT_MUTED, marginTop 2
```

### Action Bar (above bottom nav)
```
flexDirection: row, gap 10, padding 12 16
Left button  ("Edit"):     white bg, 0.5px border navy, borderRadius 12, edit icon
Right button ("Print PDF"): navy bg, white text, borderRadius 12, printer icon
Both: flex 1, padding 12, fontSize 13, fontWeight 500
```

---

## Screen 6 — Approvals Queue

### Top Bar
- Left: back arrow + "Approvals"
- Right: filter icon

### Summary Banner (white card, margin 10 16)
4-column layout:
```
Pending → number in #d97706 (amber)
Approved → number in #16a34a (green)
Rejected → number in #dc2626 (red)
Total    → number in PRIMARY_NAVY
Each: centered, number 20px 500, label 10px TEXT_MUTED, marginTop 2
```

### Filter Chips (horizontal scroll)
All · Requisitions · Invoices · PO receipts · Delivery notes

### "Awaiting your action" Section

Each approval card (margin 0 16 8):
```
Row 1: Title (flex 1, 13px 500) + type pill (gray, 10px, right)
Row 2: "ID · Submitted by · Date" (11px, TEXT_MUTED)
Row 3: Amount or reference (14px, 500, PRIMARY_NAVY), marginBottom 10
Row 4: Three action buttons (gap 8):
  View    → bg #f3f4f6, color #374151, eye icon
  Approve → bg #dcfce7, color #166534, check icon
  Reject  → bg #fef2f2, color #dc2626, x icon
  All buttons: flex 1, borderRadius 10, padding 8, fontSize 12, 500, icon+text row
```

Tapping **Approve** or **Reject** → opens confirmation bottom sheet:
```
Title: "Approve this [record type]?" or "Reject this [record type]?"
Record summary (name, ID, amount)
Reject only: text input "Reason (optional)" with borderRadius 10
Buttons: Cancel (outlined) | Confirm (navy filled for approve, red for reject)
```

### "Recently approved" Section

Compact cards (no action buttons):
```
Title (flex 1) + Approved badge (right)
"Approved by you · Date" (11px, TEXT_MUTED)
```

---

## Navigation Architecture

```
Stack Navigator (root)
├── LoginScreen
└── MainApp (Tab Navigator)
    ├── HomeTab          → HomeScreen
    ├── ModulesTab       → ModulesScreen
    │                       └── ModuleListScreen (dynamic, per module)
    │                           └── RecordDetailScreen (dynamic, per module)
    ├── [FAB]            → QuickCreateBottomSheet
    ├── PayrollTab       → PayrollScreen
    └── SummaryTab       → SummaryScreen

ApprovalsScreen accessible from:
  - HomeScreen (approvals preview card → tap)
  - ModulesTab → Approvals module card
```

### FAB Bottom Sheet (quick-create)
Opens as a modal bottom sheet on FAB tap:
```
Options:
  New Delivery Note  → navigates to Delivery Note create form
  New Requisition    → navigates to Requisition create form
  New Leave Request  → navigates to Leave Request create form
Handle/drag indicator at top
Overlay dismisses on tap outside
```

---

## Interactions & Behaviour

- All list screens: pull-to-refresh with `RefreshControl`, tintColor `ACCENT_TEAL`
- Status badges identical tokens across all screens — use a single `<StatusBadge>` component
- Record IDs: color `#1d4ed8`, tappable
- Customer names: color `#1d4ed8`, tappable → customer detail
- All TZS monetary values: formatted as `TZS X,XXX,XXX` using `Intl.NumberFormat`
- Module list screen is a reusable component parameterised by module config object
- Grid ↔ List toggle on Modules screen persists in AsyncStorage
- Recently used modules tracked in AsyncStorage, max 5, updated on every module open

---

## Branding

```
App name:    Technaware ERP Mobile
Tagline:     We offer Solutions
Login footer: © 2026 Technaware Solutions
```

Logo treatment: gear/brain icon (matches web app — see IMG-01, IMG-02 top-left)
alongside "TECHNAWARE" in 500 weight with tagline below in muted smaller text.

---

## File & Folder Structure (suggested)

```
src/
├── components/
│   ├── StatusBadge.tsx
│   ├── TopBar.tsx
│   ├── BottomNav.tsx
│   ├── ModuleCard.tsx        ← grid card
│   ├── ModuleListRow.tsx     ← list row
│   ├── RecordCard.tsx        ← list item
│   ├── ApprovalCard.tsx
│   ├── TimelineStep.tsx
│   ├── SectionLabel.tsx
│   ├── FilterChips.tsx
│   └── QuickCreateSheet.tsx
├── screens/
│   ├── LoginScreen.tsx
│   ├── HomeScreen.tsx
│   ├── ModulesScreen.tsx
│   ├── ModuleListScreen.tsx
│   ├── RecordDetailScreen.tsx
│   └── ApprovalsScreen.tsx
├── navigation/
│   └── AppNavigator.tsx
├── constants/
│   ├── colors.ts            ← all color tokens
│   ├── modules.ts           ← module config (name, icon, color, category)
│   └── typography.ts
└── utils/
    └── formatCurrency.ts    ← TZS formatter
```

---

## Design Reference Summary

| Screen | Web reference | Mobile reference | Notes |
|---|---|---|---|
| Login | IMG-01 | — | Adapt web card design to mobile |
| Home/Dashboard | IMG-02 | IMG-05 | Replace current chip menu with stat cards |
| Module chips (old) | — | IMG-06 | This flat chip layout is replaced by Screen 3 |
| GRN module active | — | IMG-07 | Replace with new Modules grid/list screen |
| GRN record list | — | IMG-08 | Pattern reused for all module list screens |
| Delivery note form | IMG-03 | — | Field names & structure reference |
| Delivery notes list | IMG-04 | — | Column names, status values, pagination |

---

*Prompt version: 1.0 — Technaware Solutions · May 2026*
