# Visual Identity: Suthra Punjab e-Challan System

## Context

This is a government solid-waste enforcement tool, not a SaaS product. Two distinct usage modes:

1. **Inspector (field, phone):** Fill a challan form quickly, save, print/download a thermal receipt PDF. Single-task, linear flow. Touch targets matter, scrolling is fine, decoration is wasted space.
2. **Admin (office, desktop):** Review dense tabular data — challans, inspectors, analytics. Scan columns, filter, compare. Information density matters more than whitespace generosity.

The design must feel **authoritative and institutional** — closer to a UK GOV.UK service or the US Census Bureau data tools than to a Notion template or a Stripe dashboard.

---

## 1. Color Tokens (Named, Semantic)

Every color has a job. None are decorative.

| Token | Hex | HSL (approx) | Role |
|---|---|---|---|
| `--surface-page` | `#FFFFFF` | 0 0% 100% | Page background, form fields |
| `--surface-inset` | `#FAFAF9` | 40 6% 98% | Sidebar bg, table header bg, section separation |
| `--surface-card` | `#FFFFFF` | 0 0% 100% | Card/panel background (distinguished by border, not shadow) |
| `--ink` | `#1C1917` | 24 10% 10% | Primary text, headings |
| `--ink-secondary` | `#57534E` | 25 6% 32% | Secondary text, descriptions, table cell text |
| `--ink-tertiary` | `#A8A29E` | 30 5% 64% | Placeholder text, disabled states, timestamps |
| `--border` | `#E7E5E4` | 30 6% 90% | All borders and dividers, 1px only |
| `--border-focus` | `#1B7A4D` | 152 63% 29% | Focus rings (matches primary) |
| `--primary` | `#1B7A4D` | 152 63% 29% | Primary action buttons, active nav indicator, links |
| `--primary-hover` | `#145C3B` | 152 63% 22% | Hover state for primary buttons |
| `--primary-subtle` | `#E8F5EE` | 148 40% 93% | Background for "Active" status badge only |
| `--primary-on` | `#FFFFFF` | — | Text on primary buttons |
| `--danger` | `#C0362C` | 4 63% 46% | Danger buttons, error borders, "Inactive" badge, violation emphasis |
| `--danger-subtle` | `#FEF2F2` | 0 69% 97% | Error message background, "Inactive" badge background |
| `--danger-text` | `#991B1B` | 0 69% 35% | Error message text |
| `--warning` | `#C77D12` | 37 83% 42% | Warning badges only (currently unused in the UI, reserved) |
| `--warning-subtle` | `#FFFBEB` | 48 100% 96% | Warning background |

> [!IMPORTANT]
> Green is used **only** for: primary action buttons, active navigation state, the "Active" status badge, and focus rings. It is never used as a decorative card wash, a gradient, or an accent stripe.
>
> Red is used **only** for: the "Inactive" status badge, error states, and the `--danger` destructive action pattern. It is not a generic "attention" color.

### What I'm changing from the current app

The current app uses `neutral-900` (#111827) as the primary button color — essentially black buttons. This is the shadcn/ui default and reads as generic. Changing to `#1B7A4D` gives primary actions a clear brand signal (this is a Punjab government green) and creates a visual hierarchy where the primary CTA is distinguishable from ordinary dark text. The rest of the palette shifts from Tailwind's `neutral` scale (blue-gray undertone) to the warmer `stone` scale (#1C1917, #57534E, etc.) which reads as more grounded and less "tech startup."

---

## 2. Typography: Public Sans

**Typeface:** [Public Sans](https://public-sans.digital.gov/) — the open-source typeface built by USWDS (US Web Design System) for government digital services. This is a deliberate choice: it was designed for exactly this class of application. It has excellent legibility at small sizes (important for dense tables), proper tabular figures, and a neutral, professional character without the Silicon Valley connotations of Inter or the generic feel of system fonts.

### Type Scale (Major Second ratio, 1.125)

| Role | Size | Weight | Line height | Token name | Where used |
|---|---|---|---|---|---|
| Page title | 22px / 1.375rem | 600 (SemiBold) | 1.3 | `--text-page-title` | "Dashboard", "Inspector Accounts", "Analytics" |
| Section heading | 15px / 0.9375rem | 600 (SemiBold) | 1.4 | `--text-section` | "Violation Details", "Citizen Details" in dialogs; fieldset headers |
| Body | 14px / 0.875rem | 400 (Regular) | 1.5 | `--text-body` | General text, form labels, descriptions |
| Table cell | 13px / 0.8125rem | 400 (Regular) | 1.4 | `--text-table` | Data cells in admin tables |
| Table header | 12px / 0.75rem | 600 (SemiBold) | 1.3 | `--text-table-head` | Column headers — sentence case, not uppercase |
| Caption / meta | 12px / 0.75rem | 400 (Regular) | 1.4 | `--text-caption` | Timestamps, "Showing N of M", helper text |
| Badge / status | 12px / 0.75rem | 500 (Medium) | 1 | `--text-badge` | "Active" / "Inactive" pills |
| Button | 14px / 0.875rem | 500 (Medium) | 1 | `--text-button` | All buttons |

> [!IMPORTANT]
> **No uppercase table headers.** The current app uses `uppercase tracking-wider` on `<thead>` — this is a common AI-generation tell (it's the Tailwind UI default). Sentence case with SemiBold weight at 12px provides the same visual separation without the "designed by a template" look.
>
> **No monospace anywhere.** CNIC numbers (00000-0000000-0), notice numbers (SPA-001), and staff IDs are all displayed in Public Sans proportional figures. Tabular figures (`font-variant-numeric: tabular-nums`) are used for numeric columns in tables so digits align vertically, but this is the proportional font's tabular feature, not a monospace font.

---

## 3. Layout System

### Grid and Spacing

- **Base unit:** 4px. All spacing is a multiple of 4px.
- **Comfortable scale:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
- **Page gutter:** 32px (desktop), 16px (mobile).
- **Max content width:** 960px for admin pages (enough for a 7-column table without excessive stretching), full viewport minus sidebar.
- **Sidebar width:** 224px fixed.

### Hierarchy through weight, not decoration

The current app uses identical white cards with `rounded-lg border shadow-sm` for everything: stat cards, table containers, chart containers, quick-link cards. This makes everything the same visual weight.

**Revised approach:**

| Element | Background | Border | Radius | Shadow |
|---|---|---|---|---|
| Page | `--surface-page` (#FFF) | — | — | — |
| Sidebar | `--surface-inset` (#FAFAF9) | Right: 1px `--border` | 0 | None |
| Data table container | `--surface-card` (#FFF) | 1px `--border` | 6px | None |
| Stat figure (dashboard) | No container — just the number, label, and a bottom border separator | — | — | — |
| Form fieldset (inspector) | `--surface-card` (#FFF) | 1px `--border` | 6px | None |
| Modal / dialog | `--surface-card` (#FFF) | 1px `--border` | 8px | `0 16px 48px rgba(0,0,0,0.12)` (only element with shadow) |
| Chart card (analytics) | `--surface-card` (#FFF) | 1px `--border` | 6px | None |

> [!TIP]
> **Only modals get a drop shadow.** Everything else uses borders. This is a deliberate departure from the "every card has `shadow-sm`" default. Shadows on persistent page elements add visual noise in a data-dense tool; they should be reserved for elements that float above the page (modals, popovers, dropdown menus).

### Border radius

- **6px** for containers (table wrappers, form fieldsets, chart cards)
- **4px** for inputs, buttons, badges
- **8px** for modals only
- **Full (9999px)** for status badge pills only

This is a tighter radius than the current `rounded-lg` (8px) / `rounded-xl` (12px) / `rounded-full` mix. Smaller radii read as more institutional and less playful.

---

## 4. Wireframes

### Admin Shell (Desktop)

```
┌──────────────────────────────────────────────────────────────────┐
│ ┌──────────┐ ┌──────────────────────────────────────────────────┐│
│ │           │ │                                                  ││
│ │  Suthra   │ │  Inspector Accounts                              ││
│ │  Punjab   │ │  Manage field inspectors and enforcement         ││
│ │           │ │  officers.                          [Add Inspector]│
│ │ ─────────── │ │                                                  ││
│ │           │ │  ┌──────────────────────────────────────────────┐││
│ │  Dashboard│ │  │ Name & Staff ID  Contact  Town  Created  St ││|
│ │ >Users    │ │  ├──────────────────────────────────────────────┤││
│ │  Challans │ │  │ Ali Khan         0300...  Lhr   12/09/26  ● ││|
│ │  Analytics│ │  │ INS-001 · ali    35201..                Actv ││|
│ │           │ │  ├──────────────────────────────────────────────┤││
│ │           │ │  │ Sara Ahmed       0321...  Fsd   11/09/26  ● ││|
│ │           │ │  │ INS-002 · sara   35401..                Actv ││|
│ │           │ │  ├──────────────────────────────────────────────┤││
│ │           │ │  │ ...                                          ││|
│ │           │ │  └──────────────────────────────────────────────┘││
│ │           │ │                                                  ││
│ │ ─────────── │ │  Showing 5 of 12 entries       [Previous][Next]││
│ │  Sign out │ │                                                  ││
│ └──────────┘ └──────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

Key layout decisions visible here:
- Sidebar has `--surface-inset` background, separated by a single border. No shadow.
- Active nav item ("Users") gets a left 3px `--primary` border and semibold text, not a background fill.
- Table header row is sentence-case, semibold 12px, on `--surface-inset` background.
- Table has no outer shadow, only a 1px border.
- "Add Inspector" button is `--primary` green, the only green element on the page.
- Status badges: "Active" gets `--primary-subtle` bg + `--primary` dot + `--primary` text. "Inactive" gets `--danger-subtle` bg + `--danger` dot + `--danger` text.

### Admin Dashboard (Desktop)

```
┌──────────────────────────────────────────────────────────────────┐
│ ┌──────────┐ ┌──────────────────────────────────────────────────┐│
│ │           │ │                                                  ││
│ │  Suthra   │ │  Dashboard                                       ││
│ │  Punjab   │ │  Welcome back, Admin.                            ││
│ │           │ │                                                  ││
│ │ ─────────── │ │  Total Challans    Total Inspectors    Active    ││
│ │           │ │  247               12                  9         ││
│ │ >Dashboard│ │  ────────────────────────────────────────────── ││
│ │  Users    │ │                                                  ││
│ │  Challans │ │  ┌───────────────────┐  ┌───────────────────┐  ││
│ │  Analytics│ │  │ All Challans      │  │ Analytics         │  ││
│ │           │ │  │ Search, filter,   │  │ View charts and   │  ││
│ │           │ │  │ and view all...   │  │ trends for...     │  ││
│ │           │ │  └───────────────────┘  └───────────────────┘  ││
│ │           │ │                                                  ││
│ └──────────┘ └──────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

Key decisions:
- Stat figures are **not wrapped in cards.** They sit directly on the page as large numbers with a label above, separated from the next section by a horizontal rule. This avoids the "three identical rounded cards" anti-pattern.
- The quick-link cards ("All Challans", "Analytics") are simple bordered containers with a heading and one line of description. No arrow (`→`), no "View details" link text.

### Inspector Form (Mobile, 375px)

```
┌────────────────────────────────┐
│  Suthra Punjab       Sign out  │
├────────────────────────────────┤
│                                │
│  New Challan                   │
│  Issue a new digital warning   │
│  notice.                       │
│                                │
│  ┌──Edit Details──┬──Receipt──┐│
│  │    (active)    │           ││
│  └────────────────┴───────────┘│
│                                │
│  Notice Information            │
│  ├────────────────────────────┐│
│  │ Notice No.                 ││
│  │ [Will be assigned on save] ││
│  │                            ││
│  │ Date & Time                ││
│  │ [2026-09-12T01:49     ]    ││
│  │                            ││
│  │ Location                   ││
│  │ [                     ]    ││
│  │                            ││
│  │ UC           Zone          ││
│  │ [       ]    [       ]     ││
│  │                            ││
│  │ Tehsil       District      ││
│  │ [       ]    [       ]     ││
│  │                            ││
│  │ Officer Name  Officer ID   ││
│  │ [Ali Khan ]  [INS-001]    ││
│  └────────────────────────────┘│
│                                │
│  Citizen Details               │
│  ├────────────────────────────┐│
│  │ ...                        ││
│  └────────────────────────────┘│
│                                │
├────────────────────────────────┤
│  [ Print ]  [■ Save & Download]│
└────────────────────────────────┘
```

Key decisions:
- Fieldset headers are plain text with `--text-section` styling (15px SemiBold, `--ink`). No emoji icons, no colored background band.
- Tab switcher ("Edit Details" / "Receipt") is a simple segmented control with a bottom border indicator, not a pill with a colored fill.
- Form inputs have a white background with `--border` border, no colored fill. Focus state adds a 2px `--primary` ring.
- Action bar is fixed at the bottom. "Print" is a secondary (outlined) button. "Save & Download" is the primary green button.

---

## 5. Motion: One Deliberate Moment

**The notice number reveal.** When an inspector saves a challan and the backend returns the assigned notice number (e.g. `SPA-042`), the notice number field transitions from the placeholder text "Will be assigned on save" to the actual number. This is the one place where animation is warranted because:

- It's the moment of commitment — the form is now a legal record.
- The inspector needs confirmation that the save succeeded.
- The notice number is the key identifier they'll reference.

**Implementation:** The notice number text cross-fades from the placeholder to the assigned number over 400ms, and the number briefly scales up from 0.95 to 1.0 with an ease-out curve. No confetti, no slide-in, no bounce — just a confident appearance that says "this is done."

No other elements in the app have custom animations. Hover states are instant color changes (no `transition-colors`). Page transitions are default Next.js behavior. Skeleton loaders pulse, but that's a loading state, not a "design" animation.

---

## 6. What Makes This Feel Distinct

This design earns its character from **restraint and specificity**, not from visual effects:

1. **Public Sans is a genuine fit**, not a default. It was built for exactly this class of government digital service. Using it signals that someone chose this typeface for a reason, not that a generator picked "the first good-looking Google Font."

2. **Color is rationed.** On a typical admin table page, the only color beyond gray/white is the green "Add Inspector" button and the status badge dots. Everything else is `--ink` and `--border`. This makes the green carry real semantic weight — "this is the action" — instead of being decorative wallpaper.

3. **Hierarchy comes from typography weight and spacing, not from container decoration.** Stat numbers on the dashboard are large semibold figures with a label above, separated by a rule — not wrapped in three identical cards with shadows. This is how government statistical publications present figures, and it looks intentional rather than generated.

4. **The inspector form is utilitarian on purpose.** An inspector filling this out at a trash dump in Lahore's July heat does not benefit from rounded card corners and soft shadows. They benefit from large touch targets, clearly labeled fields, and a prominent save button. The form earns its look from function, not from being "designed."

---

## 7. Self-Audit Against the Anti-Pattern List

| Tell to avoid | Does this plan do it? | Resolution |
|---|---|---|
| Single accent color used decoratively | **No.** Green appears only on primary buttons, active nav, "Active" badge, and focus rings. Every use has a semantic reason. | ✅ Pass |
| Identical rounded cards everywhere | **No.** Stats are un-carded figures. Tables have a single bordered container. Only modals have shadows. Radii vary by element role (6px containers, 4px inputs, 8px modals). | ✅ Pass |
| ALL-CAPS tracked-out eyebrow labels | **No.** Table headers are sentence-case SemiBold. The current `uppercase tracking-wider` on `<thead>` will be removed. Fieldset headers are sentence-case. | ✅ Pass |
| Decorative dashes in headings | **No.** The current `<title>` tag has "Suthra Punjab — e-Challan Management System" with an em-dash. This will become "Suthra Punjab · e-Challan Management System" or just "Suthra Punjab" for the sidebar. Page headings are plain: "Dashboard", "Inspector Accounts", "Challan Entries", "Analytics". | ✅ Pass |
| Emojis in the interface | **Current app has them.** Fieldset headers use 📄, 👤, ⚠️. Shell nav icons use Unicode symbols (⊞, ⊟). The empty-state placeholders use 👤 and 📋. **All will be replaced** with lucide-react icon components (`FileText`, `User`, `AlertTriangle`, `LayoutDashboard`, `Users`, `FileStack`, `BarChart3`). | ✅ Will fix |
| `→` in button/link text | **Current app has it.** Dashboard stat cards say "View details →". This will be removed — the cards themselves are links, no arrow text needed. | ✅ Will fix |
| Monospace for data labels | **No.** All text is Public Sans. Tabular figures for numeric columns only. | ✅ Pass |

---

## 8. Files to Modify

### Global Design System
- [globals.css](file:///c:/Users/Administrator/Desktop/SPA%20e%20CHALLAN%20Full%20Stack/src/app/globals.css) — Replace CSS custom properties with the new token set. Add Public Sans `@font-face` or Google Fonts import.
- [tailwind.config.ts](file:///c:/Users/Administrator/Desktop/SPA%20e%20CHALLAN%20Full%20Stack/tailwind.config.ts) — Remap Tailwind theme colors to the new tokens. Adjust border-radius scale. Add Public Sans to `fontFamily`.
- [layout.tsx](file:///c:/Users/Administrator/Desktop/SPA%20e%20CHALLAN%20Full%20Stack/src/app/layout.tsx) — Replace Geist font imports with Public Sans. Fix `<title>` em-dash.

### Shell
- [Shell.tsx](file:///c:/Users/Administrator/Desktop/SPA%20e%20CHALLAN%20Full%20Stack/src/components/Shell.tsx) — Update sidebar styling (inset bg, active state with left border, lucide icons replacing Unicode symbols). Update mobile nav.

### Admin Pages
- [admin/page.tsx](file:///c:/Users/Administrator/Desktop/SPA%20e%20CHALLAN%20Full%20Stack/src/app/admin/page.tsx) — Restyle stat figures (remove card wrappers, remove "→"). Restyle quick-link cards.
- [admin/users/page.tsx](file:///c:/Users/Administrator/Desktop/SPA%20e%20CHALLAN%20Full%20Stack/src/app/admin/users/page.tsx) — Remove uppercase table headers. Update button colors to primary green. Remove emoji from empty state. Apply new type scale.
- [admin/entries/EntriesClient.tsx](file:///c:/Users/Administrator/Desktop/SPA%20e%20CHALLAN%20Full%20Stack/src/app/admin/entries/EntriesClient.tsx) — Remove emoji from empty state. Remove uppercase headers. Apply token colors.
- [admin/analytics/AnalyticsClient.tsx](file:///c:/Users/Administrator/Desktop/SPA%20e%20CHALLAN%20Full%20Stack/src/app/admin/analytics/AnalyticsClient.tsx) — Update chart accent color from gray-900 to `--primary`. Update DashCard styling.

### Inspector
- [inspector/ChallanClient.tsx](file:///c:/Users/Administrator/Desktop/SPA%20e%20CHALLAN%20Full%20Stack/src/app/inspector/ChallanClient.tsx) — Replace emoji in fieldset headers with lucide icons. Implement notice number reveal animation. Update button text (remove emoji from Print button).
- [inspector/challan.css](file:///c:/Users/Administrator/Desktop/SPA%20e%20CHALLAN%20Full%20Stack/src/app/inspector/challan.css) — Remap CSS variables to new tokens. Reduce border-radius. Restyle fieldset headers (remove colored background, use plain semibold text). Adjust button styling to match token system. **Do not touch** the `#challan-preview` thermal receipt styles or `@media print` rules.

### shadcn/ui Components
- [ui/button.tsx](file:///c:/Users/Administrator/Desktop/SPA%20e%20CHALLAN%20Full%20Stack/src/components/ui/button.tsx) — Update `default` variant to use `--primary` / `--primary-hover`.
- [ui/input.tsx](file:///c:/Users/Administrator/Desktop/SPA%20e%20CHALLAN%20Full%20Stack/src/components/ui/input.tsx) — Update focus ring to `--primary`.
- [ui/table.tsx](file:///c:/Users/Administrator/Desktop/SPA%20e%20CHALLAN%20Full%20Stack/src/components/ui/table.tsx) — Remove uppercase from header styles.
- Other ui/ files (select, dialog, etc.) — Update to use new token colors.

### Login
- [login/page.tsx](file:///c:/Users/Administrator/Desktop/SPA%20e%20CHALLAN%20Full%20Stack/src/app/login/page.tsx) — Full redesign per section 9 below, not just a color/font update.

---

## 9. Login Page — Two-Panel Layout

The login page is the one screen that earns more visual presence than the
restrained admin/inspector screens — it's the first institutional impression,
not a data-dense working screen.

**Structure:** two panels, full viewport height.

- **Left/hero panel** (`--primary` green background, white text): the agency
  crest logo, a plain heading ("Welcome to Suthra Punjab e-Challan" — no
  tracked-out eyebrow label above it), one short descriptive line, 2-3 benefit
  bullets that are true of this actual app (e.g. "Secure, role-based access
  for enforcement staff", "Every notice recorded with a verifiable ID",
  "Works on any device in the field"), and a small department credit line
  pinned to the bottom ("Local Government & Community Development Department
  · Government of the Punjab").
- **Right/form panel** (white background): a plain sentence-case heading
  ("Sign in"), one short line of description, a Username field, a Password
  field with a show/hide toggle, and the primary green "Sign in" button. A
  short honest trust note near the bottom is fine (e.g. "Access is limited to
  authorized personnel") — never a claim the app doesn't actually make.

**Explicitly do NOT include**, even though a reference login mockup used them:
tracked-out all-caps eyebrow labels (this app already rejects that pattern
elsewhere, see section 7); an "Account type" selector (Employee/Citizen/
Contractor); a CNIC-vs-Email sign-in method toggle; a "Forgot password?" link;
a "Create an account" link. None of these apply here — this app has exactly
one login form (username + password), role is decided server-side from the
account, and accounts are admin-created, not self-registered. Adding any of
these would be UI for features that don't exist.

**Mobile:** the hero panel collapses above the form panel (stacked, not
side-by-side) below 768px, with a smaller crest and a condensed version of the
same copy.

---

## Decisions (previously Open Questions — resolved, build to these)

- **Chart accent color:** confirmed — area chart line and bar chart fills use
  `--primary` (#1B7A4D). Pie chart remains multi-gray, distinguishing
  categories by shade.
- **Dashboard stat cards:** confirmed — no card wrapper. Total Challans,
  Total Inspectors, and Active Inspectors are shown as bare figures with a
  label above and a rule separator, per the dashboard wireframe in section 4.
- **Sidebar brand element:** confirmed — add the agency crest logo at 16-20px
  next to the "Suthra Punjab" sidebar text, not text-only.

## Verification Plan

### Visual Inspection
- Run `npm run dev` and visually verify each page (login, dashboard, users, entries, analytics, inspector form) at desktop and mobile widths.
- Confirm no emojis remain in the rendered UI.
- Confirm no `→` arrows in button/link text.
- Confirm table headers are sentence-case, not uppercase.
- Confirm only modals have shadows.
- Confirm the notice number animation works on challan save.

### Build Check
- Run `npm run build` to confirm no TypeScript or build errors.

---

## 2026-09-15 — Refinement Pass: Interaction Cues and Contextual Clarity

This is a targeted refinement of the system above, not a new visual direction.
The institutional palette, typography, compact radii, and border-first layout
remain the defaults. The following exceptions are purposeful: an interactive
hover elevation for dashboard destinations, and a paper-depth treatment for
the on-screen receipt only.

### 1. Login Hero — Center the Operational Message Block

**Decision:** do not add decorative filler. Recompose the desktop hero as one
balanced, vertically centered agency-and-service block so the empty lower half
does not read as unfinished.

- On `md` and above, the crest, heading, description, and three verified
  benefits become a single `max-width: 448px` content group centered within
  the available hero height. The group receives `padding-block: 48px` and a
  reserved `64px` bottom clearance for the department credit.
- The department credit remains anchored at the hero's bottom with the
  existing `--text-caption`, `--primary-on / 70%` treatment; it is not pulled
  into the centered block or used as decoration.
- The existing green `--primary` panel, white type, and actual enforcement
  copy stay unchanged. No illustration, gradient, pattern, or unsubstantiated
  civic claim is introduced.
- Below `768px`, retain the compact stacked hero above the sign-in form; its
  content follows normal document flow rather than forcing a viewport-height
  gap.

### 2. Dashboard Quick Actions — Semantic Icons and Interactive Elevation

**Decision:** make the two destination cards clearly actionable without
turning them into general-purpose card decoration.

| Destination | Icon | Icon token/value | Card treatment |
|---|---|---|---|
| All Challans | `FileStack` | `20px`, `--primary` | `20px` padding; icon and text separated by `12px` |
| Analytics | `BarChart3` | `20px`, `--primary` | `20px` padding; icon and text separated by `12px` |

- Both cards keep their `1px --border`, `6px` radius, and white resting
  surface. Icons identify an operational destination; they are not standalone
  decoration.
- Resting elevation remains `none`. On hover and keyboard focus, apply
  `transform: translateY(-2px)`, a transient `0 4px 10px rgba(28,25,23,0.10)`
  shadow, and `--border-focus` focus ring. Use a `150ms ease-out` transition
  for the transform and shadow only.
- Preserve the full-card link target and add no arrow text or secondary CTA.

### 3. Entries — High Prior-Warning Signal

**Decision:** flag only a record whose `warningCount >= 3`. This is the
meaningful "high prior warnings" threshold; current baseline data contains
only 0–1, so no existing ordinary record would acquire a misleading accent.

- High-warning desktop rows receive an inset left rule: `3px --warning`
  (`#C77D12`). Standard rows remain unaccented.
- The notice-number cell also receives a compact `AlertTriangle` (`14px`,
  `--warning`) with visible hover title and accessible label,
  `"High prior-warning count: N"`. This makes the rule a data signal rather
  than unexplained color.
- Apply the same threshold and left rule to mobile entry cards. Do not add a
  warning column, recolor the whole row, or flag warning counts of 0–2.
- This expands the semantic use of `--warning` from badges to the same
  warning-state signal; `--warning-subtle` remains reserved for any future
  expanded warning detail, not a row wash.

### 4. Analytics — Structured Violation-Category Legend

**Decision:** remove Recharts' wrapped bottom legend and render an explicit
data list next to the donut.

- At `lg` widths, the category card uses a two-region layout: donut at left
  and legend at right, with a `16px` gap. The donut stays centered in its
  region and retains the current gray category palette.
- The legend is a two-column grid at desktop and a single-column list below
  the chart on narrow screens. Each row uses an `8px × 8px` color swatch, a
  shortened category name, and its tabular count aligned to the row end.
- Row text uses `--text-caption`; swatches use the exact corresponding
  `PIE_COLORS` value. Long names truncate with an accessible full-name title,
  rather than wrapping into an inline paragraph.
- Tooltips remain the detailed inspection path. The legend presents category
  identity and count; it is not made interactive unless chart filtering is
  later introduced.

### 5. Inspector Receipt — Screen-Only Paper Depth

**Decision:** give the on-screen receipt its own physical-layer cue without
changing the thermal receipt element or any print/PDF output.

- Introduce `--shadow-receipt-preview: 0 8px 20px rgba(28,25,23,0.14), 0 1px
  2px rgba(28,25,23,0.10)` for the screen-only `#print-root` wrapper while it
  sits inside `#preview-card`.
- Keep `#challan-preview` itself at its current `302px`, white, square-edged
  thermal-paper specification. The new depth belongs to the display wrapper,
  so html-to-canvas/PDF capture of the receipt remains unchanged.
- `#preview-card` retains its institutional border and no persistent shadow;
  it is the staging surface, while the inner receipt is the physical object.
- Do not modify `@media print` rules, receipt typography, receipt spacing, or
  PDF-generation targets.

### 6. Mobile Inspector Tip — Tab-Aware Copy

**Decision:** use breakpoint-specific instructional copy so the form no
longer promises a simultaneously visible right-side preview on mobile.

- Desktop (`769px` and above) retains: "Fill in the required details below.
  The live preview on the right will update automatically."
- Mobile (`768px` and below) uses: "Complete the details, then open Receipt to
  review the live preview before saving."
- Both variants retain the existing `Quick & Easy Process:` label and
  `--surface-inset` callout treatment. Exactly one variant is exposed to
  screen readers at each breakpoint.

## Refinement Verification Plan

### Visual Inspection
- Capture current baseline views for login, dashboard, users, entries, and
  analytics before implementation; capture the inspector form at `375px` with
  an authenticated inspector account when test credentials are available.
- Verify the desktop login group reads as vertically balanced without added
  decorative content.
- Verify quick-action hover and keyboard focus provide a clear lift while
  resting cards remain border-only.
- Verify only `warningCount >= 3` entries receive the labelled warning signal.
- Verify the donut legend stays structured at desktop and narrow widths.
- Verify receipt depth appears only on screen and print/PDF output is
  pixel-identical to the baseline.
- Verify the mobile tip refers to the Receipt tab, not a right-side preview.
